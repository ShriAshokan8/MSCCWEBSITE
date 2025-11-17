// Block model and basic helpers for MSC Nexus.
// This will evolve into a full Notion-style block editor.

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
 * Minimal placeholder: create an empty page block list.
 * Later, this will manage full block CRUD and rendering.
 */
export function createEmptyBlockDocument() {
  return [
    {
      type: BLOCK_TYPES.PARAGRAPH,
      text: "",
    },
  ];
}