interface NodeLike {
  text?: unknown;
  content?: unknown;
}

function isNode(value: unknown): value is NodeLike {
  return typeof value === 'object' && value !== null;
}

function countWords(node: unknown): number {
  if (!isNode(node)) return 0;
  let count = 0;
  if (typeof node.text === 'string') {
    const trimmed = node.text.trim();
    count += trimmed ? trimmed.split(/\s+/).length : 0;
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      count += countWords(child);
    }
  }
  return count;
}

const WORDS_PER_MINUTE = 200;

export function estimateReadMinutes(content: unknown): number {
  return Math.max(1, Math.round(countWords(content) / WORDS_PER_MINUTE));
}

export function hasText(content: unknown): boolean {
  return countWords(content) > 0;
}
