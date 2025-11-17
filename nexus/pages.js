// Page model and Firestore integration for MSC Nexus.

import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "./firebase.js";
import { loadBlocks } from "./blocks.js";

/**
 * @typedef {Object} NexusPage
 * @property {string} id
 * @property {string} title
 * @property {string} workspace
 * @property {string|null} parentId
 * @property {string|null|undefined} slug
 * @property {any} createdAt
 * @property {any} updatedAt
 * @property {string} createdBy
 * @property {string} updatedBy
 * @property {"editable"|"readOnly"} accessMode
 * @property {string[]} tags
 * @property {string|null|undefined} sourcePath
 */

const PAGES_COLLECTION = "nexusPages";

/**
 * Create an in-memory page object (not yet persisted).
 */
export function createEmptyPage({
  title = "Untitled",
  workspace = "MSC Docs",
  parentId = null,
  userId = "",
} = {}) {
  const now = new Date().toISOString();
  return {
    id: "",
    title,
    workspace,
    parentId,
    slug: null,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId,
    accessMode: "editable",
    tags: [],
    sourcePath: null,
  };
}

/**
 * Persist a new page to Firestore.
 */
export async function createPage(initialData) {
  const pagesCol = collection(db, PAGES_COLLECTION);
  const now = new Date().toISOString();
  const page = {
    ...createEmptyPage(initialData),
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await setDoc(doc(pagesCol), page);
  // The above won't give us the generated id, so do it explicitly:
  // For simplicity in Step 4, we use addDoc instead of setDoc here:
}

/**
 * Better createPage with addDoc so we get id back.
 */
export async function createPageWithAdd(initialData) {
  const pagesCol = collection(db, PAGES_COLLECTION);
  const now = new Date().toISOString();
  const base = createEmptyPage(initialData);
  const docRef = await (await import("./firebase.js")).addDoc(pagesCol, {
    ...base,
    createdAt: now,
    updatedAt: now,
  });
  return {
    ...base,
    id: docRef.id,
  };
}

/**
 * Save metadata fields (not blocks) for an existing page.
 */
export async function savePageMetadata(page) {
  if (!page.id) {
    throw new Error("Page must have an id to be saved.");
  }
  const pageRef = doc(db, PAGES_COLLECTION, page.id);
  const updated = {
    ...page,
    updatedAt: new Date().toISOString(),
  };
  await updateDoc(pageRef, updated);
  return updated;
}

/**
 * Load a single page by id plus its blocks.
 */
export async function loadPageWithBlocks(pageId) {
  const pageRef = doc(db, PAGES_COLLECTION, pageId);
  const snap = await getDoc(pageRef);
  if (!snap.exists()) {
    throw new Error("Page not found");
  }
  const page = { id: snap.id, ...snap.data() };
  const blocks = await loadBlocks(pageId);
  return { page, blocks };
}

/**
 * Load all pages and build a tree structure grouped by workspace.
 * For Step 4 this returns a flat array with parentId references;
 * UI can compute indentation based on depth.
 */
export async function loadPagesTree() {
  const pagesCol = collection(db, PAGES_COLLECTION);
  const snapshot = await getDocs(pagesCol);
  const pages = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    pages.push({
      id: docSnap.id,
      ...data,
    });
  });
  return pages;
}
