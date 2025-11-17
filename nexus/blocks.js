// Block model and Firestore helpers for MSC Nexus.

import {
  db,
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
} from "./firebase.js";

export const BLOCK_TYPES = {
  HEADING1: "heading1",
  HEADING2: "heading2",
  HEADING3: "heading3",
  PARAGRAPH: "paragraph",
  BULLETED_LIST: "bulletedList",
  NUMBERED_LIST: "numberedList",
  TODO: "todo",
  CALLOUT: "callout",
  DIVIDER: "divider",
  CODE: "code",
};

/**
 * Minimal placeholder: create an initial block document for a new page.
 */
export function createEmptyBlockDocument() {
  return [
    {
      type: BLOCK_TYPES.PARAGRAPH,
      text: "",
    },
  ];
}

/**
 * Load all blocks for a given pageId from the nexusBlocks collection.
 * Blocks are stored as documents:
 * {
 *   pageId: string,
 *   index: number,
 *   block: NexusBlock
 * }
 */
export async function loadBlocks(pageId) {
  const blocksCol = collection(db, "nexusBlocks");
  const q = query(blocksCol, where("pageId", "==", pageId));
  const snapshot = await getDocs(q);

  const items = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (typeof data.index === "number" && data.block) {
      items.push({ index: data.index, block: data.block, id: docSnap.id });
    }
  });

  items.sort((a, b) => a.index - b.index);
  return items.map((x) => x.block);
}

/**
 * Save blocks for a page.
 * For now we simply append new blocks documents.
 */
export async function saveBlocks(pageId, blocks) {
  const blocksCol = collection(db, "nexusBlocks");
  let index = 0;
  for (const block of blocks) {
    await addDoc(blocksCol, {
      pageId,
      index,
      block,
    });
    index += 1;
  }
}

/**
 * Render blocks into the container.
 * - "code" blocks: monospaced, scrollable area, labelled as imported content.
 * - "callout" blocks: prominent info callout.
 * - Other types: basic text inputs/areas.
 *
 * readOnly: when true, editing is disabled.
 * page: optional; used to show sourcePath for imported content.
 *
 * Returns: function collectBlocks() that reads current values back into block JSON.
 */
export function renderBlocks(container, blocks, { readOnly, page }) {
  container.innerHTML = "";

  blocks.forEach((block, idx) => {
    const row = document.createElement("div");
    row.className = "block-row";

    if (block.type === BLOCK_TYPES.CALLOUT) {
      const callout = document.createElement("div");
      callout.className = "block-callout";
      const icon = document.createElement("span");
      icon.className = "block-callout-icon";
      icon.textContent = block.icon || "ℹ️";

      const text = document.createElement("div");
      text.className = "block-callout-text";
      text.textContent = block.text || "";

      callout.appendChild(icon);
      callout.appendChild(text);
      row.appendChild(callout);
    } else if (block.type === BLOCK_TYPES.CODE) {
      const wrapper = document.createElement("div");
      wrapper.className = "block-code-wrapper";

      const label = document.createElement("div");
      label.className = "block-code-label";

      const sourcePath =
        (page && page.sourcePath) ||
        (typeof block.sourcePath === "string" ? block.sourcePath : null);

      if (sourcePath) {
        label.textContent = `Imported content from ${sourcePath}`;
      } else {
        label.textContent = "Imported content";
      }

      const pre = document.createElement("pre");
      pre.className = "block-code-view";
      pre.textContent = block.code || "";
      pre.style.whiteSpace = "pre-wrap";
      pre.style.wordBreak = "break-word";

      wrapper.appendChild(label);
      wrapper.appendChild(pre);
      row.appendChild(wrapper);
    } else if (block.type === BLOCK_TYPES.HEADING1) {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "block-heading1";
      input.value = block.text || "";
      input.placeholder = "Heading 1";
      input.disabled = readOnly;
      row.appendChild(input);
    } else if (block.type === BLOCK_TYPES.HEADING2) {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "block-heading2";
      input.value = block.text || "";
      input.placeholder = "Heading 2";
      input.disabled = readOnly;
      row.appendChild(input);
    } else {
      // default paragraph for now
      const textarea = document.createElement("textarea");
      textarea.className = "block-paragraph";
      textarea.value = block.text || "";
      textarea.placeholder = "Write something…";
      textarea.disabled = readOnly;
      row.appendChild(textarea);
    }

    container.appendChild(row);
  });

  // Collector converts edited DOM back into blocks array.
  return function collectBlocks() {
    const rows = Array.from(container.querySelectorAll(".block-row"));
    const result = [];
    rows.forEach((row, i) => {
      const block = blocks[i] || { type: BLOCK_TYPES.PARAGRAPH, text: "" };
      if (block.type === BLOCK_TYPES.CALLOUT || block.type === BLOCK_TYPES.CODE) {
        // Imported blocks remain unchanged in Step 6.
        result.push(block);
        return;
      }

      const textarea = row.querySelector("textarea");
      const input = row.querySelector("input");

      if (textarea) {
        result.push({
          ...block,
          text: textarea.value,
        });
      } else if (input) {
        result.push({
          ...block,
          text: input.value,
        });
      } else {
        result.push(block);
      }
    });
    return result;
  };
}
