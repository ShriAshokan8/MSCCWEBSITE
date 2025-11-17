// Block model and Firestore helpers for MSC Nexus.

import {
  db,
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
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
 * For Step 4 we keep it simple:
 * - delete existing docs for pageId and recreate in order.
 * (We may optimise later.)
 */
export async function saveBlocks(pageId, blocks) {
  // For Step 4 we rely on addDoc with monotonically increasing index.
  // A full delete+recreate would need batched deletes; for now we just append.
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
 * Render blocks into a simple editable list (placeholder editor).
 * readOnly: when true, inputs are disabled.
 */
export function renderBlocks(container, blocks, { readOnly }) {
  container.innerHTML = "";

  blocks.forEach((block, idx) => {
    const row = document.createElement("div");
    row.className = "block-row";

    if (block.type === BLOCK_TYPES.HEADING1) {
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
    } else if (block.type === BLOCK_TYPES.CODE) {
      const textarea = document.createElement("textarea");
      textarea.className = "block-code";
      textarea.value = block.code || "";
      textarea.placeholder = "Code";
      textarea.disabled = readOnly;
      row.appendChild(textarea);
    } else {
      // default paragraph
      const textarea = document.createElement("textarea");
      textarea.className = "block-paragraph";
      textarea.value = block.text || "";
      textarea.placeholder = "Write something…";
      textarea.disabled = readOnly;
      row.appendChild(textarea);
    }

    container.appendChild(row);
  });

  // Return a function to extract the edited document back to JSON.
  return function collectBlocks() {
    const rows = Array.from(container.querySelectorAll(".block-row"));
    const result = [];
    rows.forEach((row, i) => {
      const textarea = row.querySelector("textarea");
      const input = row.querySelector("input");
      const original = blocks[i] || { type: BLOCK_TYPES.PARAGRAPH, text: "" };

      if (textarea) {
        if (original.type === BLOCK_TYPES.CODE) {
          result.push({
            ...original,
            code: textarea.value,
          });
        } else {
          result.push({
            ...original,
            text: textarea.value,
          });
        }
      } else if (input) {
        result.push({
          ...original,
          text: input.value,
        });
      } else {
        result.push(original);
      }
    });
    return result;
  };
}
