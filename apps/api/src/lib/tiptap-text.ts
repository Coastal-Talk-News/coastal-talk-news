/**
 * Flattens a Tiptap document into plain text for contentText, which exists
 * only to feed the generated search_vector column (see the init migration).
 * This is intentionally not a full ProseMirror walker — it only needs enough
 * fidelity for full-text search to find real words, not to reproduce layout.
 */

interface TiptapNode {
  text?: unknown;
  content?: unknown;
  [key: string]: unknown;
}

function isNode(value: unknown): value is TiptapNode {
  return typeof value === 'object' && value !== null;
}

function collect(node: unknown, parts: string[]): void {
  if (!isNode(node)) return;
  if (typeof node.text === 'string') {
    parts.push(node.text);
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      collect(child, parts);
    }
  }
}

export function extractPlainText(content: unknown): string {
  const parts: string[] = [];
  collect(content, parts);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
