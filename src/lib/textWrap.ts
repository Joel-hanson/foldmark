/**
 * Word-wrap for bookmark face copy. Uses a Cormorant-Garamond-ish width
 * estimate so the SVG preview and PDF agree without needing the real font
 * metrics at layout time. Slightly conservative so lines never spill past
 * the panel edge.
 */

export type TextWeight = "regular" | "bold" | "italic";

function charFactor(ch: string, weight: TextWeight): number {
  const boldBump = weight === "bold" ? 1.06 : 1;
  if (ch === " ") return 0.22 * boldBump;
  if ("ilIjtfr.,'|:;!".includes(ch)) return 0.28 * boldBump;
  if ("mwMW@%".includes(ch)) return 0.78 * boldBump;
  if ("ABCDEFGHOKQPRUVXYZ".includes(ch)) return 0.62 * boldBump;
  return (weight === "bold" ? 0.5 : 0.46) * boldBump;
}

/** Approximate advance width in the same point space the layout uses. */
export function measureBookmarkText(text: string, size: number, weight: TextWeight = "regular"): number {
  let w = 0;
  for (const ch of text) w += size * charFactor(ch, weight);
  return w;
}

function breakLongWord(word: string, maxWidth: number, size: number, weight: TextWeight): string[] {
  if (measureBookmarkText(word, size, weight) <= maxWidth) return [word];
  const parts: string[] = [];
  let chunk = "";
  for (const ch of word) {
    const next = chunk + ch;
    if (chunk && measureBookmarkText(next, size, weight) > maxWidth) {
      parts.push(chunk);
      chunk = ch;
    } else {
      chunk = next;
    }
  }
  if (chunk) parts.push(chunk);
  return parts;
}

/** Split into lines that each fit within maxWidth. */
export function wrapBookmarkText(
  text: string,
  maxWidth: number,
  size: number,
  weight: TextWeight = "regular",
): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  if (measureBookmarkText(cleaned, size, weight) <= maxWidth) return [cleaned];

  const lines: string[] = [];
  let current = "";

  for (const word of cleaned.split(" ")) {
    for (const piece of breakLongWord(word, maxWidth, size, weight)) {
      const next = current ? `${current} ${piece}` : piece;
      if (measureBookmarkText(next, size, weight) <= maxWidth) {
        current = next;
      } else {
        if (current) lines.push(current);
        current = piece;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Prefer the given size; if that wraps to more than maxLines, shrink until it
 * fits (or until minSize). Keeps long phrases readable on a narrow bookmark.
 */
export function fitWrappedText(
  text: string,
  maxWidth: number,
  preferredSize: number,
  weight: TextWeight,
  maxLines = 3,
  minSize = 9,
): { lines: string[]; size: number } {
  let size = preferredSize;
  while (size > minSize) {
    const lines = wrapBookmarkText(text, maxWidth, size, weight);
    if (lines.length <= maxLines) return { lines, size };
    size -= 1;
  }
  const lines = wrapBookmarkText(text, maxWidth, size, weight);
  return { lines: lines.slice(0, maxLines), size };
}
