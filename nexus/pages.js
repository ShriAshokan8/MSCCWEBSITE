import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
} from "./firebase.js";
import { loadBlocks } from "./blocks.js";

const PAGES_COLLECTION = "nexusPages";

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

export async function createPage(initialData) {
  const pagesCol = collection(db, PAGES_COLLECTION);
  const base = createEmptyPage(initialData);
  const now = new Date().toISOString();
  const docRef = await addDoc(pagesCol, {
    ...base,
    createdAt: now,
    updatedAt: now,
  });
  return {
    ...base,
    id: docRef.id,
  };
}

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
