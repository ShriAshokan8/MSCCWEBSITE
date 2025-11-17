// UI helpers for MSC Nexus.

import { createPage, loadPagesTree, loadPageWithBlocks } from "./pages.js";
import { createEmptyBlockDocument, renderBlocks, saveBlocks } from "./blocks.js";
import { canEditPage } from "./permissions.js";

/**
 * Compute depth of a page by walking up parentId links.
 */
function computeDepth(page, allPagesMap, maxDepth = 10) {
  let depth = 0;
  let current = page;
  while (current.parentId && depth < maxDepth) {
    const parent = allPagesMap.get(current.parentId);
    if (!parent) break;
    depth += 1;
    current = parent;
  }
  return depth;
}

/**
 * Group pages by workspace.
 */
function groupPagesByWorkspace(pages) {
  const map = new Map();
  for (const page of pages) {
    if (!map.has(page.workspace)) {
      map.set(page.workspace, []);
    }
    map.get(page.workspace).push(page);
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
 * Render page tree for the current workspace.
 */
function renderPageTree(pages, currentWorkspace, onSelectPage) {
  const container = document.getElementById("page-tree");
  if (!container) return;

  container.innerHTML = "";

  const filtered = pages.filter((p) => p.workspace === currentWorkspace);
  const map = new Map(filtered.map((p) => [p.id, p]));

  filtered.forEach((page) => {
    const depth = computeDepth(page, map);
    const item = document.createElement("div");
    item.className = `sidebar-item page-level-${Math.min(depth, 3)}`;
    item.textContent = page.title || "Untitled";
    item.dataset.pageId = page.id;
    item.addEventListener("click", () => onSelectPage(page.id));
    container.appendChild(item);
  });
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

    const collect = renderBlocks(blocksContainer, blocks, {
      readOnly: !editable,
    });

    // For Step 4 we do not wire auto-save; but we can keep a simple
    // explicit save hook later (e.g. keyboard shortcut); left as TODO.
    // void collect;
  } catch (err) {
    console.error("Failed to load page:", err);
    titleInput.value = "Error loading page";
    if (blocksContainer) {
      blocksContainer.innerHTML =
        "<div class='editor-placeholder'>Unable to load this page.</div>";
    }
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
  const currentWorkspace = workspaces[0] || "MSC Docs";

  renderWorkspaceList(workspaces, currentWorkspace);
  renderPageTree(allPages, currentWorkspace, (pageId) =>
    renderPageEditor(user, pageId),
  );

  // Workspace switching
  const workspaceListEl = document.getElementById("workspace-list");
  if (workspaceListEl) {
    workspaceListEl.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const ws = target.dataset.workspace;
      if (!ws) return;
      renderWorkspaceList(workspaces, ws);
      renderPageTree(allPages, ws, (pageId) => renderPageEditor(user, pageId));
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

      // For now, we create empty blocks for a new page.
      const blocks = createEmptyBlockDocument();
      await saveBlocks(page.id, blocks);

      // Refresh tree and open the new page.
      const updatedPages = await loadPagesTree();
      renderPageTree(updatedPages, currentWorkspace, (pageId) =>
        renderPageEditor(user, pageId),
      );
      await renderPageEditor(user, page.id);
    });
  }
}
