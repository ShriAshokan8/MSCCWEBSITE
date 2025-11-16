// UI helpers for MSC Nexus.
// This module will eventually:
// - Render the workspace list and page tree
// - Bind toolbar actions (New Page, etc.)
// - Connect the editor UI with pages/blocks.

import { createEmptyPage } from "./pages.js";
import { createEmptyBlockDocument } from "./blocks.js";

export function setupBaseUI() {
  // Placeholder wiring to ensure imports are valid.
  const newPageButton = document.getElementById("btn-new-page");
  if (newPageButton) {
    newPageButton.addEventListener("click", () => {
      const page = createEmptyPage();
      const blocks = createEmptyBlockDocument();
      // TODO: integrate with real page creation and editor rendering.
      void page;
      void blocks;
    });
  }
}