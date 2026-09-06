import {
  PDFDocument,
  rgb,
  clip,
  endPath,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { DesignState } from "./types";
import { resolveColors, type ResolvedColors } from "./colors";
import { buildUnitPlan, type DrawOp } from "./unitPlan";
import { computeSheet } from "./sheet";
import { getFontFiles, loadBookmarkFontBytes } from "./bookmarkFont";

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function colorFor(colors: ResolvedColors, key: keyof ResolvedColors) {
  return hexToRgb(colors[key]);
}

function drawDashedLine(
  page: PDFPage,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: ReturnType<typeof rgb>,
  thickness = 0.7,
  opacity?: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const dash = 4;
  const gap = 3;
  let d = 0;
  while (d < len) {
    const a = d / len;
    const b = Math.min(d + dash, len) / len;
    page.drawLine({
      start: { x: x1 + dx * a, y: y1 + dy * a },
      end: { x: x1 + dx * b, y: y1 + dy * b },
      thickness,
      color,
      opacity,
    });
    d += dash + gap;
  }
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; mime: string } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid image data URL");
  const mime = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, mime };
}

async function embedDataUrl(doc: PDFDocument, dataUrl: string): Promise<PDFImage> {
  const { bytes, mime } = dataUrlToBytes(dataUrl);
  if (mime === "image/png") return doc.embedPng(bytes);
  if (mime === "image/jpeg" || mime === "image/jpg") return doc.embedJpg(bytes);
  throw new Error("Only PNG and JPEG images can be printed");
}

type FontSet = {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
};

/**
 * Draws one unit's operations (from unitPlan.ts) onto the page at the given
 * origin. This is the ONLY place unit-local coordinates are converted to PDF
 * coordinates — the same op list is also consumed as-is (no flip needed) by
 * the SVG preview, since that space is already top-left/y-down.
 */
function drawOpsForUnit(
  page: PDFPage,
  ops: DrawOp[],
  originX: number,
  originYBottom: number,
  unitH: number,
  colors: ResolvedColors,
  fonts: FontSet,
  images: Map<string, PDFImage>,
) {
  const flipY = (y: number) => originYBottom + (unitH - y);

  for (const op of ops) {
    if (op.kind === "rect") {
      page.drawRectangle({
        x: originX + op.x,
        y: flipY(op.y + op.h),
        width: op.w,
        height: op.h,
        color: op.fill ? colorFor(colors, op.fill) : undefined,
        opacity: op.opacity,
        borderColor: op.stroke && op.stroke !== "none" ? colorFor(colors, op.stroke) : undefined,
        borderWidth: op.stroke && op.stroke !== "none" ? 1 : 0,
      });
    } else if (op.kind === "line") {
      const color = colorFor(colors, op.stroke);
      const x1 = originX + op.x1;
      const y1 = flipY(op.y1);
      const x2 = originX + op.x2;
      const y2 = flipY(op.y2);
      if (op.dashed) {
        drawDashedLine(page, x1, y1, x2, y2, color, op.weight ?? 0.7, op.opacity);
      } else {
        page.drawLine({
          start: { x: x1, y: y1 },
          end: { x: x2, y: y2 },
          thickness: op.weight ?? 1,
          color,
          opacity: op.opacity,
        });
      }
    } else if (op.kind === "circle") {
      page.drawCircle({
        x: originX + op.cx,
        y: flipY(op.cy),
        size: op.r,
        color: op.fill && op.fill !== "none" ? colorFor(colors, op.fill) : undefined,
        opacity: op.opacity,
        borderColor: op.stroke ? colorFor(colors, op.stroke) : undefined,
        borderWidth: op.stroke ? 0.9 : 0,
      });
    } else if (op.kind === "path") {
      const scale = op.scale ?? 1;
      const fillKey = op.fill && op.fill !== "none" ? op.fill : null;
      const strokeKey = op.stroke ?? null;
      // pdf-lib flips SVG Y for us; pass the unit-space origin flipped into PDF Y.
      page.drawSvgPath(op.d, {
        x: originX + op.x,
        y: flipY(op.y),
        scale,
        ...(fillKey ? { color: colorFor(colors, fillKey), opacity: op.opacity } : {}),
        ...(strokeKey
          ? {
              borderColor: colorFor(colors, strokeKey),
              borderWidth: op.weight ?? 1.2,
              borderOpacity: op.opacity,
            }
          : {}),
      });
    } else if (op.kind === "image") {
      const img = images.get(op.href);
      if (!img) continue;
      // Cover-crop into the target rect (same idea as CSS object-fit: cover).
      const scale = Math.max(op.w / img.width, op.h / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offsetX = (op.w - drawW) / 2;
      const offsetY = (op.h - drawH) / 2;
      const clipX = originX + op.x;
      const clipY = flipY(op.y + op.h);
      page.pushOperators(pushGraphicsState(), rectangle(clipX, clipY, op.w, op.h), clip(), endPath());
      page.drawImage(img, {
        x: clipX + offsetX,
        y: clipY + offsetY,
        width: drawW,
        height: drawH,
        opacity: op.opacity ?? 1,
      });
      page.pushOperators(popGraphicsState());
    } else if (op.kind === "text") {
      const f = op.italic ? fonts.italic : op.bold ? fonts.bold : fonts.regular;
      const color = colorFor(colors, op.color);
      // Lines are already wrapped in unitPlan; draw each op as a single centered line.
      let x = originX + op.x;
      if (op.align === "center") {
        const width = f.widthOfTextAtSize(op.text, op.size);
        x = originX + op.x - width / 2;
      } else if (op.align === "right") {
        const width = f.widthOfTextAtSize(op.text, op.size);
        x = originX + op.x - width;
      }
      page.drawText(op.text, {
        x,
        y: flipY(op.y),
        size: op.size,
        font: f,
        color,
      });
    }
  }
}

export async function buildBookmarkPdf(design: DesignState): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const sheet = computeSheet(design.paperSize, design.shape);
  const page = doc.addPage([sheet.page.w, sheet.page.h]);

  const files = getFontFiles(design.fontId);
  const [regularBytes, boldBytes, italicBytes] = await Promise.all([
    loadBookmarkFontBytes(files.regular),
    loadBookmarkFontBytes(files.bold),
    loadBookmarkFontBytes(files.italic),
  ]);
  const fonts: FontSet = {
    regular: await doc.embedFont(regularBytes),
    bold: await doc.embedFont(boldBytes),
    italic: await doc.embedFont(italicBytes),
  };

  const colors = resolveColors(design.paletteId, design.printMode);
  const bgImage = design.surfaceMode === "image" ? design.bgImage : null;
  const plan = buildUnitPlan(
    design.shape,
    design.title,
    design.subtitle,
    design.pattern,
    design.paperSize,
    bgImage,
    design.fontSize,
    design.motif,
    design.accordionPanels,
    design.accordionDirection,
  );

  const images = new Map<string, PDFImage>();
  if (bgImage) {
    images.set(bgImage, await embedDataUrl(doc, bgImage));
  }

  for (const pos of sheet.positions) {
    const originX = pos.x;
    const originYBottom = sheet.page.h - (pos.y + plan.size.h);
    drawOpsForUnit(page, plan.ops, originX, originYBottom, plan.size.h, colors, fonts, images);
  }

  return doc.save();
}

export function downloadPdfBytes(bytes: Uint8Array, filename: string) {
  const copy = new Uint8Array(bytes);
  const blob = new Blob([copy], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
