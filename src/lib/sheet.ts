import type { PaperSize, Shape } from "./types";
import { getUnitSize } from "./unitPlan";
import { PAGE_SIZE, MARGIN, MIN_GUTTER, FOOTER_HEIGHT } from "./paper";

export { PAGE_SIZE, MARGIN, MIN_GUTTER, FOOTER_HEIGHT };

export type SheetLayout = {
  page: { w: number; h: number };
  margin: number;
  footerHeight: number;
  unit: { w: number; h: number };
  cols: number;
  rows: number;
  count: number;
  /** Top-left position of each unit, in page space with a top-left origin
   * (y-down). Callers that need PDF (bottom-up) coordinates should flip. */
  positions: { x: number; y: number }[];
};

/**
 * Tiles as many copies of a shape as fit on a page, edge to edge, with the
 * leftover space distributed evenly as gutters — so a sheet never prints
 * with one lonely unit floating in a sea of blank paper. Used identically by
 * the on-screen sheet preview and by the PDF export.
 *
 * Accordion is full-bleed (one unit = the whole page) so you fold the sheet
 * itself — no printer margin strip around it.
 */
export function computeSheet(paperSize: PaperSize, shape: Shape): SheetLayout {
  const page = PAGE_SIZE[paperSize];
  const unit = getUnitSize(shape, paperSize);

  if (shape === "accordion") {
    return {
      page,
      margin: 0,
      footerHeight: 0,
      unit,
      cols: 1,
      rows: 1,
      count: 1,
      positions: [{ x: 0, y: 0 }],
    };
  }

  const usableW = page.w - MARGIN * 2;
  const usableH = page.h - MARGIN * 2 - FOOTER_HEIGHT;

  const cols = Math.max(1, Math.floor((usableW + MIN_GUTTER) / (unit.w + MIN_GUTTER)));
  const rows = Math.max(1, Math.floor((usableH + MIN_GUTTER) / (unit.h + MIN_GUTTER)));

  const gutterX = cols > 1 ? (usableW - cols * unit.w) / (cols - 1) : 0;
  const gutterY = rows > 1 ? (usableH - rows * unit.h) / (rows - 1) : 0;

  const gridW = cols * unit.w + (cols - 1) * gutterX;
  const gridH = rows * unit.h + (rows - 1) * gutterY;
  const startX = MARGIN + (usableW - gridW) / 2;
  const startY = MARGIN + (usableH - gridH) / 2;

  const positions: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions.push({ x: startX + c * (unit.w + gutterX), y: startY + r * (unit.h + gutterY) });
    }
  }

  return { page, margin: MARGIN, footerHeight: FOOTER_HEIGHT, unit, cols, rows, count: positions.length, positions };
}
