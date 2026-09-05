const CJK_RE = /[\u4e00-\u9fa5]/g;

/** Extract unique Chinese characters from text, preserving order. */
export function extractChineseChars(text: string): string[] {
  const matches = text.match(CJK_RE);
  if (!matches) return [];
  return [...new Set(matches)];
}
