// Page model and Firestore integration for MSC Nexus.
// This module will manage:
// - NexusPage CRUD in Firestore
// - Page tree loading per workspace
// - Integration with blocks.js

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

/**
 * Create a basic in-memory NexusPage object (not yet persisted).
 * Placeholder only; Firestore integration will be added later.
 */
export function createEmptyPage({ title = "Untitled", workspace = "MSC Docs" } = {}) {
  const now = new Date().toISOString();
  return {
    id: "",
    title,
    workspace,
    parentId: null,
    slug: null,
    createdAt: now,
    updatedAt: now,
    createdBy: "",
    updatedBy: "",
    accessMode: "editable",
    tags: [],
    sourcePath: null,
  };
}