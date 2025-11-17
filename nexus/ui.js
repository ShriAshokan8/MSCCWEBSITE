// UI helpers for MSC Nexus.

import { createPage, loadPagesTree, loadPageWithBlocks } from "./pages.js";
import {
  createEmptyBlockDocument,
  renderBlocks,
  saveBlocks,
} from "./blocks.js";
import { canEditPage } from "./permissions.js";

/**
 * Build a parent->children map from pages.
 */
function buildChildrenMap(pages) {
  const childrenMap = new Map();
  pages.forEach((p) => {
    const parentId = p.parentId || null;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId).push(p);
  });
  // sort children per parent by title
  childrenMap.forEach((arr) => {
    arr.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  });
  return childrenMap;
}

/**
 * Group pages by workspace.
 */
function groupPagesByWorkspace(pages) {
  const map = new Map();
  for (const page of pages) {
    const ws = page.workspace || "MSC Docs";
    if (!map.has(ws)) {
      map.set(ws, []);
    }
    map.get(ws).push(page);
  }
  return map;
}

/**
 * Render workspace list in sidebar.
 */
function renderWorkspaceList(workspaces, currentWorkspace) {
  const container = document.getElementById("workspace-list");
  const workspaceNameEl = document.getElementById("current-workspace-name");
  if (!container) return;

  container.innerHTML = "";
  workspaces.forEach((ws) => {
    const item = document.createElement("div");
    item.className = "sidebar-item" + (ws === currentWorkspace ? " active" : "");
    item.textContent = ws;
    item.dataset.workspace = ws;
    container.appendChild(item);
  });

  if (workspaceNameEl && currentWorkspace) {
    workspaceNameEl.textContent = currentWorkspace;
  }
}

/**
 * Recursively render the page tree for a given workspace, using parentId relationships.
 */
function renderPageTreeHierarchy(container, childrenMap, parentId, depth, onSelectPage) {
  const children = childrenMap.get(parentId) || [];
  children.forEach((page) => {
    const item = document.createElement("div");
    const clampedDepth = Math.min(depth, 3);
    item.className = `sidebar-item page-level-${clampedDepth}`;
    item.textContent = page.title || "Untitled";
    item.dataset.pageId = page.id;
    item.addEventListener("click", () => onSelectPage(page.id));
    container.appendChild(item);

    // Recurse into children of this page.
    renderPageTreeHierarchy(
      container,
      childrenMap,
      page.id,
      depth + 1,
      onSelectPage,
    );
  });
}

/**
 * Render the page tree for the current workspace.
 */
function renderPageTree(pages, currentWorkspace, onSelectPage) {
  const container = document.getElementById("page-tree");
  if (!container) return;
  container.innerHTML = "";

  const pagesInWorkspace = pages.filter(
    (p) => (p.workspace || "MSC Docs") === currentWorkspace,
  );

  const childrenMap = buildChildrenMap(pagesInWorkspace);

  // Start from root nodes (parentId == null)
  renderPageTreeHierarchy(container, childrenMap, null, 1, onSelectPage);
}

/**
 * Render the editor for a page and its blocks.
 */
async function renderPageEditor(user, pageId) {
  const titleInput = document.getElementById("page-title-input");
  const accessBadge = document.getElementById("page-access-mode");
  const editBadge = document.getElementById("page-editability");
  const blocksContainer = document.getElementById("blocks-container");

  if (!titleInput || !blocksContainer) {
    return;
  }

  try {
    const { page, blocks } = await loadPageWithBlocks(pageId);
    const editable = canEditPage(user, page);

    titleInput.value = page.title || "";
    titleInput.disabled = !editable;

    if (accessBadge) {
      accessBadge.textContent =
        page.accessMode === "readOnly" ? "Read-only mode" : "Editable";
    }

    if (editBadge) {
      if (editable) {
        editBadge.textContent = "You can edit";
        editBadge.classList.remove("page-badge-readonly");
        editBadge.classList.add("page-badge-editable");
      } else {
        editBadge.textContent = "View only";
        editBadge.classList.remove("page-badge-editable");
        editBadge.classList.add("page-badge-readonly");
      }
    }

    // Render blocks, passing page so code blocks can show sourcePath label.
    const collect = renderBlocks(blocksContainer, blocks, {
      readOnly: !editable,
      page,
    });

    // NOTE: In Step 6 we are not yet wiring auto-save.
    // collect() can be used later to persist edits via saveBlocks().
    void collect;
  } catch (err) {
    console.error("Failed to load page:", err);
    titleInput.value = "Error loading page";
    blocksContainer.innerHTML =
      "<div class='editor-placeholder'>Unable to load this page.</div>";
  }
}

/**
 * Setup base UI once we have a logged-in user.
 */
export async function setupBaseUI(user) {
  const userEmailEl = document.getElementById("user-email");
  const userRoleEl = document.getElementById("user-role");
  if (userEmailEl) userEmailEl.textContent = user.email || "";
  if (userRoleEl) userRoleEl.textContent = user.role || "No role";

  const allPages = await loadPagesTree();
  const wsMap = groupPagesByWorkspace(allPages);
  const workspaces = Array.from(wsMap.keys()).sort();
  let currentWorkspace = workspaces[0] || "MSC Docs";

  renderWorkspaceList(workspaces, currentWorkspace);
  renderPageTree(allPages, currentWorkspace, (pageId) =>
    renderPageEditor(user, pageId),
  );

  const workspaceListEl = document.getElementById("workspace-list");
  if (workspaceListEl) {
    workspaceListEl.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const ws = target.dataset.workspace;
      if (!ws) return;
      currentWorkspace = ws;
      renderWorkspaceList(workspaces, currentWorkspace);
      renderPageTree(allPages, currentWorkspace, (pageId) =>
        renderPageEditor(user, pageId),
      );
    });
  }

  const newPageButton = document.getElementById("btn-new-page");
  if (newPageButton) {
    newPageButton.addEventListener("click", async () => {
      const title = "New Page";
      const page = await createPage({
        title,
        workspace: currentWorkspace,
        parentId: null,
        userId: user.uid,
      });

      const blocks = createEmptyBlockDocument();
      await saveBlocks(page.id, blocks);

      const updatedPages = await loadPagesTree();
      renderPageTree(updatedPages, currentWorkspace, (pageId) =>
        renderPageEditor(user, pageId),
      );
      await renderPageEditor(user, page.id);
    });
  }
}
