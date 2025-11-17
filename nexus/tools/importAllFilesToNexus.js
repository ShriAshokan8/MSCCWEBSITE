#!/usr/bin/env node

/**
 * MSC Nexus – Import Script
 *
 * Imports all MSC folders & files into Firestore as:
 * - nexusPages (folders and files mapped to pages)
 * - nexusBlocks (imported document content as code or callout blocks)
 *
 * This script is intended to be run once to seed Firebase.
 */

import fs from "fs";
import path from "path";
import url from "url";
import admin from "firebase-admin";

// ---------- CONFIGURATION ----------

// Adjust these paths when running the script.
const MSC_ROOT_DIR = process.env.MSC_ROOT_DIR || path.resolve("MSC");
const EXTRACTED_TEXT_FILE =
  process.env.MSC_EXTRACTED_TEXT_FILE ||
  path.resolve("MSC_PART3_EXTRACTED.txt");

// Firestore limits: doc size <= ~1MiB; we use a conservative cutoff for code block text.
const MAX_CODE_BLOCK_CHARS = 800_000;

// Firebase Admin initialization
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_ACCOUNT_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.resolve(__dirname, "serviceAccountKey.json"); // You must supply this file.

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(
    `Service account JSON not found at ${SERVICE_ACCOUNT_PATH}. ` +
      `Set GOOGLE_APPLICATION_CREDENTIALS or create serviceAccountKey.json next to this script.`,
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ---------- TYPES / MODELS (aligned with Part 1 spec) ----------

/**
 * @typedef {Object} NexusPage
 * @property {string} id
 * @property {string} title
 * @property {string} workspace
 * @property {string|null} parentId
 * @property {string|null|undefined} slug
 * @property {FirebaseFirestore.Timestamp} createdAt
 * @property {FirebaseFirestore.Timestamp} updatedAt
 * @property {string} createdBy
 * @property {string} updatedBy
 * @property {"editable"|"readOnly"} accessMode
 * @property {string[]} tags
 * @property {string|null|undefined} sourcePath
 */

// ---------- HELPERS: WORKSPACE MAPPING ----------

/**
 * Map a relative path under MSC root to a workspace name.
 * The mapping is based on the Part 2 tree and Part 1 workspace names.
 */
function deriveWorkspaceFromRelativePath(relPathSegments) {
  // relPathSegments is an array like ["MSC", "MSC", "2024-25", ...]
  const lower = relPathSegments.map((p) => p.toLowerCase());

  // Find anchor segments after "msc":
  const mscIndex = lower.indexOf("msc");
  const afterMsc = mscIndex >= 0 ? lower.slice(mscIndex + 1) : lower;

  if (afterMsc[0] === "2024-25") return "MSC Archive 2024–25";
  if (afterMsc[0] === "2025-26") return "MSC Archive 2025–26";

  if (afterMsc[0] === "announcements-clubs") return "Announcements / Clubs";
  if (afterMsc[0] === "letters to teachers") return "Letters to Teachers";
  if (afterMsc[0] === "logos") return "Logo Assets";
  if (afterMsc[0] === "photos-files of projects") return "Photos & Projects";
  if (afterMsc[0] === "quiz") return "Quiz Materials";
  if (afterMsc[0] === "slides") return "Slides";
  if (afterMsc[0] === "supported events") return "Supported Events";

  if (afterMsc[0] === "jobs given to msc team") return "Jobs Given to MSC Team";

  // Fallback workspace
  return "MSC Docs";
}

// ---------- HELPERS: EXTRACTED TEXT PARSING (Part 3) ----------

/**
 * Parse MSC_PART3_EXTRACTED.txt into a map:
 *   key: normalized MSC path (e.g. "MSC/MSC/2024-25/..."),
 *   value: { hasText: boolean, text: string }
 */
function parseExtractedTextFile(extractedFilePath) {
  if (!fs.existsSync(extractedFilePath)) {
    console.warn(
      `Extracted text file not found at ${extractedFilePath}. All files will be treated as [NO TEXT CONTENT].`,
    );
    return new Map();
  }

  const raw = fs.readFileSync(extractedFilePath, "utf8");
  const lines = raw.split(/\r?\n/);

  const map = new Map();
  let currentFileKey = null;
  let buffer = [];

  const flush = () => {
    if (!currentFileKey) return;
    const content = buffer.join("\n").trim();
    if (!content || content === "[NO TEXT CONTENT]") {
      map.set(currentFileKey, { hasText: false, text: "" });
    } else {
      map.set(currentFileKey, { hasText: true, text: content });
    }
  };

  for (const line of lines) {
    const match = line.match(/^----- FILE:\s*(.+?)\s*-----$/);
    if (match) {
      // Start of a new file section.
      flush();
      buffer = [];
      const pathInExtract = match[1]; // e.g. /mnt/data/MSC/MSC/2024-25/...
      currentFileKey = normalizeExtractedPathKey(pathInExtract);
    } else {
      buffer.push(line);
    }
  }
  flush();

  return map;
}

/**
 * Normalise the path key as stored in the extracted text file.
 *
 * Example input: "/mnt/data/MSC/MSC/2024-25/Quiz/Combined.docx"
 * Result: "MSC/MSC/2024-25/Quiz/Combined.docx"
 */
function normalizeExtractedPathKey(fullPathFromExtract) {
  const normalized = fullPathFromExtract.replace(/\\/g, "/");
  const idx = normalized.toLowerCase().indexOf("/msc/");
  if (idx >= 0) {
    return normalized.slice(idx + 1); // remove leading slash -> "MSC/..."
  }
  return normalized;
}

/**
 * Build a key from a local filesystem path under MSC_ROOT_DIR
 * to match the keys created by normalizeExtractedPathKey.
 */
function makeExtractKeyFromLocalPath(absFilePath) {
  const normalizedRoot = MSC_ROOT_DIR.replace(/\\/g, "/");
  const normalizedFile = absFilePath.replace(/\\/g, "/");
  const idx = normalizedFile.toLowerCase().indexOf(
    normalizedRoot.toLowerCase().replace(/\\/g, "/"),
  );
  if (idx >= 0) {
    const relativeFromRoot = normalizedFile.slice(idx);
    if (!relativeFromRoot.toLowerCase().startsWith("msc/")) {
      const msci = relativeFromRoot.toLowerCase().indexOf("msc/");
      if (msci >= 0) {
        return relativeFromRoot.slice(msci);
      }
    }
    return relativeFromRoot;
  }
  return normalizedFile;
}

// ---------- HELPERS: FILESYSTEM WALK ----------

/**
 * Recursively walk the MSC directory tree and collect folders + files.
 */
function walkMscTree(rootDir) {
  /** @type {Array<{type:"folder"|"file",absPath:string,relPath:string,name:string}>} */
  const items = [];

  function walk(currentAbs, currentRel) {
    const stat = fs.statSync(currentAbs);
    if (stat.isDirectory()) {
      items.push({
        type: "folder",
        absPath: currentAbs,
        relPath: currentRel,
        name: path.basename(currentAbs),
      });
      const children = fs.readdirSync(currentAbs, { withFileTypes: true });
      for (const child of children) {
        const childAbs = path.join(currentAbs, child.name);
        const childRel = currentRel
          ? path.join(currentRel, child.name)
          : child.name;
        walk(childAbs, childRel);
      }
    } else if (stat.isFile()) {
      items.push({
        type: "file",
        absPath: currentAbs,
        relPath: currentRel,
        name: path.basename(currentAbs),
      });
    }
  }

  walk(rootDir, ""); // root has relPath = ""
  return items;
}

// ---------- FIRESTORE HELPERS ----------

async function createPageDocForFolder(relPath, parentId, workspace) {
  const pagesCol = db.collection("nexusPages");
  const now = admin.firestore.Timestamp.now();

  const pageData = /** @type {Omit<NexusPage,"id">} */ ({
    title: relPath === "" ? "MSC Root" : path.basename(relPath),
    workspace,
    parentId: parentId || null,
    slug: null,
    createdAt: now,
    updatedAt: now,
    createdBy: "import-script",
    updatedBy: "import-script",
    accessMode: "editable",
    tags: [],
    sourcePath: null,
  });

  const docRef = await pagesCol.add(pageData);
  return docRef.id;
}

async function createPageDocForFile(relPath, parentId, workspace) {
  const pagesCol = db.collection("nexusPages");
  const now = admin.firestore.Timestamp.now();

  const title = path.basename(relPath);
  const pageData = /** @type {Omit<NexusPage,"id">} */ ({
    title,
    workspace,
    parentId: parentId || null,
    slug: null,
    createdAt: now,
    updatedAt: now,
    createdBy: "import-script",
    updatedBy: "import-script",
    accessMode: "editable",
    tags: [],
    sourcePath: relPath.replace(/\\/g, "/"),
  });

  const docRef = await pagesCol.add(pageData);
  return docRef.id;
}

async function createBlockDocsForFile(pageId, fileInfo, extractedMap) {
  const blocksCol = db.collection("nexusBlocks");
  const key = makeExtractKeyFromLocalPath(fileInfo.absPath);
  const entry = extractedMap.get(key);

  let blockDoc;
  if (entry && entry.hasText) {
    const text =
      entry.text.length > MAX_CODE_BLOCK_CHARS
        ? entry.text.slice(0, MAX_CODE_BLOCK_CHARS)
        : entry.text;

    blockDoc = {
      pageId,
      index: 0,
      block: {
        type: "code",
        language: "text",
        code: text,
      },
    };
  } else {
    const ext = path.extname(fileInfo.absPath) || "(no extension)";
    const sourcePath = fileInfo.relPath.replace(/\\/g, "/");
    const message = `This page represents a non-text or non-extractable file.\n\nSource path: ${sourcePath}\nExtension: ${ext}`;

    blockDoc = {
      pageId,
      index: 0,
      block: {
        type: "callout",
        icon: "📁",
        text: message,
      },
    };
  }

  await blocksCol.add(blockDoc);
}

// ---------- MAIN IMPORT LOGIC ----------

async function main() {
  console.log("MSC Nexus import starting...");
  console.log(`Using MSC root: ${MSC_ROOT_DIR}`);
  console.log(`Using extracted text file: ${EXTRACTED_TEXT_FILE}`);

  if (!fs.existsSync(MSC_ROOT_DIR)) {
    console.error(`MSC root directory not found at ${MSC_ROOT_DIR}`);
    process.exit(1);
  }

  const extractedMap = parseExtractedTextFile(EXTRACTED_TEXT_FILE);
  const items = walkMscTree(MSC_ROOT_DIR);

  // First pass: create pages for all folders and remember their IDs by relPath.
  /** @type {Map<string, string>} */
  const folderPageIdByRelPath = new Map();

  for (const item of items.filter((i) => i.type === "folder")) {
    const relPath = item.relPath; // "" for root, or "MSC/..." etc.
    const segments = relPath ? relPath.replace(/\\/g, "/").split("/") : [];
    const workspace = deriveWorkspaceFromRelativePath(segments);

    let parentRelPath = "";
    if (relPath && relPath.includes(path.sep)) {
      parentRelPath = relPath.substring(0, relPath.lastIndexOf(path.sep));
    } else if (relPath && relPath.includes("/")) {
      parentRelPath = relPath.substring(0, relPath.lastIndexOf("/"));
    }

    const parentId =
      parentRelPath !== "" ? folderPageIdByRelPath.get(parentRelPath) || null : null;

    const pageId = await createPageDocForFolder(relPath, parentId, workspace);
    folderPageIdByRelPath.set(relPath, pageId);
  }

  // Second pass: create pages + blocks for files.
  for (const item of items.filter((i) => i.type === "file")) {
    const relPath = item.relPath;
    const segments = relPath.replace(/\\/g, "/").split("/");
    const workspace = deriveWorkspaceFromRelativePath(segments);

    const parentRelPath = path.dirname(relPath);
    const parentId =
      parentRelPath && parentRelPath !== "."
        ? folderPageIdByRelPath.get(parentRelPath) || null
        : null;

    const pageId = await createPageDocForFile(relPath, parentId, workspace);
    await createBlockDocsForFile(pageId, item, extractedMap);
  }

  console.log("MSC Nexus import completed.");
}

main().catch((err) => {
  console.error("Fatal error during import:", err);
  process.exit(1);
});
