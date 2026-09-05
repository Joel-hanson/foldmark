import type { FontId, FontInfo, FontSizeId, FontSizeInfo } from "./types";

export type FontFiles = {
  regular: string;
  bold: string;
  italic: string;
};

/**
 * Bookmark face typefaces. The same files are loaded for the SVG preview
 * (@font-face) and embedded in the PDF so on-screen and print never drift.
 */
export const BOOKMARK_FONTS: FontInfo[] = [
  {
    id: "cormorant",
    name: "Cormorant",
    family: "Cormorant Garamond",
    fallback: '"Iowan Old Style", "Palatino Linotype", Palatino, serif',
  },
  {
    id: "baskerville",
    name: "Baskerville",
    family: "Libre Baskerville",
    fallback: 'Baskerville, "Times New Roman", serif',
  },
  {
    id: "lora",
    name: "Lora",
    family: "Lora",
    fallback: 'Georgia, "Times New Roman", serif',
  },
  {
    id: "playfair",
    name: "Playfair",
    family: "Playfair Display",
    fallback: 'Georgia, "Times New Roman", serif',
  },
  {
    id: "fraunces",
    name: "Fraunces",
    family: "Fraunces Bookmark",
    fallback: 'Fraunces, Georgia, serif',
  },
];

export const BOOKMARK_FONT_FILES: Record<FontId, FontFiles> = {
  cormorant: {
    regular: "/fonts/CormorantGaramond-Regular.otf",
    bold: "/fonts/CormorantGaramond-SemiBold.otf",
    italic: "/fonts/CormorantGaramond-Italic.otf",
  },
  baskerville: {
    regular: "/fonts/LibreBaskerville-Regular.ttf",
    bold: "/fonts/LibreBaskerville-Bold.ttf",
    italic: "/fonts/LibreBaskerville-Italic.ttf",
  },
  lora: {
    regular: "/fonts/Lora-Regular.ttf",
    bold: "/fonts/Lora-SemiBold.ttf",
    italic: "/fonts/Lora-Italic.ttf",
  },
  playfair: {
    regular: "/fonts/PlayfairDisplay-Regular.ttf",
    bold: "/fonts/PlayfairDisplay-SemiBold.ttf",
    italic: "/fonts/PlayfairDisplay-Italic.ttf",
  },
  fraunces: {
    regular: "/fonts/Fraunces-Regular.ttf",
    bold: "/fonts/Fraunces-SemiBold.ttf",
    italic: "/fonts/Fraunces-Italic.ttf",
  },
};

export const FONT_SIZES: FontSizeInfo[] = [
  { id: "sm", name: "Small" },
  { id: "md", name: "Medium" },
  { id: "lg", name: "Large" },
  { id: "xl", name: "Extra large" },
];

/** Base title point sizes for accordion / corner by size preset. */
export const FONT_SIZE_POINTS: Record<FontSizeId, { accordion: number; corner: number; subtitle: number }> = {
  sm: { accordion: 12, corner: 14, subtitle: 8 },
  md: { accordion: 16, corner: 18, subtitle: 10 },
  lg: { accordion: 20, corner: 24, subtitle: 11 },
  xl: { accordion: 26, corner: 30, subtitle: 12 },
};

export function getFontInfo(id: FontId): FontInfo {
  return BOOKMARK_FONTS.find((f) => f.id === id) ?? BOOKMARK_FONTS[0];
}

export function getFontFiles(id: FontId): FontFiles {
  return BOOKMARK_FONT_FILES[id] ?? BOOKMARK_FONT_FILES.cormorant;
}

export function cssFontStack(id: FontId): string {
  const info = getFontInfo(id);
  return `"${info.family}", ${info.fallback}`;
}

const cache = new Map<string, Uint8Array>();

export async function loadBookmarkFontBytes(path: string): Promise<Uint8Array> {
  const hit = cache.get(path);
  if (hit) return hit;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Could not load font ${path}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  cache.set(path, bytes);
  return bytes;
}
