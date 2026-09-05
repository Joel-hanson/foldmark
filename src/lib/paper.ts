import type { PaperSize } from "./types";

export const PAGE_SIZE: Record<PaperSize, { w: number; h: number }> = {
  a4: { w: 595.28, h: 841.89 },
  letter: { w: 612, h: 792 },
  a5: { w: 419.53, h: 595.28 },
  legal: { w: 612, h: 1008 },
};

/** Page margin for tiled shapes (corner pocket). Accordion prints full-bleed. */
export const MARGIN = 28;
export const MIN_GUTTER = 12;
export const FOOTER_HEIGHT = 22;
