import type {
  AccordionDirection,
  AccordionPanels,
  FontSizeId,
  MotifId,
  PaperSize,
  PatternId,
  Shape,
} from "./types";
import { PAGE_SIZE } from "./paper";
import { fitWrappedText, wrapBookmarkText } from "./textWrap";
import { FONT_SIZE_POINTS } from "./bookmarkFont";
import { buildCoverMotif, motifHeightFactor } from "./motifs";

/** Default panel count — ~1.5in panels along the fan-fold axis, clamped to 3–6. */
export function suggestedAccordionPanels(
  paperSize: PaperSize,
  direction: AccordionDirection = "vertical",
): AccordionPanels {
  const page = PAGE_SIZE[paperSize];
  const span = direction === "vertical" ? page.h : page.w;
  return Math.min(6, Math.max(3, Math.round(span / 108))) as AccordionPanels;
}

/**
 * Every coordinate below is in a top-left-origin, y-down space, sized exactly
 * to the unit's physical size in points (1/72in). Both the on-screen SVG
 * preview and the PDF renderer read this SAME list of operations, so the two
 * can never drift apart the way hand-duplicated drawing code used to.
 */
export type DrawOp =
  | {
      kind: "rect";
      x: number;
      y: number;
      w: number;
      h: number;
      fill?: "paper" | "accent" | "secondary";
      stroke?: "ink" | "mark" | "accent" | "none";
      opacity?: number;
    }
  | {
      kind: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      stroke: "ink" | "mark" | "accent";
      dashed?: boolean;
      weight?: number;
      opacity?: number;
    }
  | {
      kind: "circle";
      cx: number;
      cy: number;
      r: number;
      stroke?: "ink" | "mark" | "accent";
      fill?: "paper" | "accent" | "none";
      opacity?: number;
    }
  | {
      /** SVG path in local coords (y-down), drawn at (x, y) with optional scale. */
      kind: "path";
      d: string;
      x: number;
      y: number;
      scale?: number;
      stroke?: "ink" | "mark" | "accent";
      fill?: "paper" | "accent" | "secondary" | "none";
      weight?: number;
      opacity?: number;
    }
  | {
      kind: "image";
      x: number;
      y: number;
      w: number;
      h: number;
      href: string;
      opacity?: number;
    }
  | {
      kind: "text";
      x: number;
      y: number;
      text: string;
      size: number;
      bold?: boolean;
      italic?: boolean;
      color: "ink" | "secondary" | "mark" | "accent";
      maxWidth?: number;
      align?: "left" | "center" | "right";
    };

export type UnitPlan = {
  shape: Shape;
  size: { w: number; h: number };
  cutOutline: { x: number; y: number; w: number; h: number };
  /** Fold order captions shown under the preview, e.g. ["1–4 fan-fold", "5 finish"]. */
  foldCount: number;
  ops: DrawOp[];
};

export type SurfaceInput = {
  pattern: PatternId;
  /** When set, draws the image as the face fill instead of a pattern. */
  bgImage?: string | null;
};

/** The corner pocket has a fixed physical size regardless of paper. The
 * accordion fold is built to use the entire printable area of whatever sheet
 * is chosen — the whole point is folding the full page, not cutting a piece
 * out of it. */
export function getUnitSize(shape: Shape, paperSize: PaperSize): { w: number; h: number } {
  if (shape === "corner") return { w: 216, h: 216 }; // 3in square
  // Accordion is the whole sheet — fold the page itself, edge to edge.
  return PAGE_SIZE[paperSize];
}

function titleSize(title: string, big: number, mid: number, small: number) {
  // Nudge long phrases down a step so wrapping starts from a sensible size.
  if (title.length <= 2) return big;
  if (title.length <= 10) return mid;
  return small;
}

function preferredSizes(fontSize: FontSizeId, title: string, shape: Shape) {
  const base = FONT_SIZE_POINTS[fontSize];
  const preferred = shape === "corner" ? base.corner : base.accordion;
  // Slight auto-step for very long titles, without overriding the user's size pick.
  const nudged = titleSize(title, preferred, preferred, Math.max(10, preferred - 3));
  return { title: nudged, subtitle: base.subtitle };
}

/** Deterministic pseudo-random in [0,1) — same seed ⇒ same pattern in SVG + PDF. */
function hash01(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Rounds trig-derived coordinates to a fixed precision. Math.sin/cos can
 * return values that differ in their last bit between Node (SSR) and the
 * browser's JS engine — invisible to the eye, but enough for React to flag a
 * hydration mismatch on every generated line. Rounding collapses both sides
 * to the same string before they ever reach the DOM. */
function r2(n: number) {
  return Math.round(n * 100) / 100;
}

function pushSpiral(
  ops: DrawOp[],
  cx: number,
  cy: number,
  turns: number,
  spacing: number,
  startAngle: number,
  opacity: number,
) {
  const step = 0.38;
  const maxT = turns * Math.PI * 2;
  let prevX = cx + Math.cos(startAngle) * 0.4;
  let prevY = cy + Math.sin(startAngle) * 0.4;
  for (let t = step; t <= maxT; t += step) {
    const wobble = 1 + Math.sin(t * 2.1) * 0.04;
    const r = ((spacing * t) / (Math.PI * 2)) * wobble;
    const x = cx + Math.cos(t + startAngle) * r;
    const y = cy + Math.sin(t + startAngle) * r;
    ops.push({
      kind: "line",
      x1: r2(prevX),
      y1: r2(prevY),
      x2: r2(x),
      y2: r2(y),
      stroke: "accent",
      weight: 0.85,
      opacity: r2(opacity),
    });
    prevX = x;
    prevY = y;
  }
}

/** Famous, easy-to-print repeating patterns, generated as plain shapes so
 * they draw through the exact same op list as everything else — no images,
 * no second code path that could drift between preview and PDF. Kept subtle
 * (low opacity) so text stays legible on top of them. */
export function buildPatternOps(pattern: PatternId, w: number, h: number): DrawOp[] {
  const ops: DrawOp[] = [];
  if (pattern === "stripes") {
    const bandCount = Math.max(6, Math.round(w / 16));
    const bandW = w / bandCount;
    for (let i = 0; i < bandCount; i++) {
      if (i % 2 === 0) continue;
      ops.push({ kind: "rect", x: i * bandW, y: 0, w: bandW, h, fill: "accent", opacity: 0.15 });
    }
    return ops;
  }
  if (pattern === "polka") {
    const spacing = 24;
    let row = 0;
    for (let y = spacing * 0.6; y < h; y += spacing * 0.86) {
      const offset = (row % 2) * (spacing / 2);
      for (let x = spacing * 0.6 + offset; x < w; x += spacing) {
        ops.push({ kind: "circle", cx: x, cy: y, r: 3, fill: "accent", opacity: 0.4 });
      }
      row++;
    }
    return ops;
  }
  if (pattern === "chevron") {
    const rowH = 20;
    const zig = 10;
    for (let y = 0; y < h; y += rowH) {
      let x = 0;
      let up = true;
      let prev = { x: 0, y: y + zig };
      while (x < w) {
        x = Math.min(x + zig, w);
        up = !up;
        const point = { x, y: y + (up ? 0 : zig) };
        ops.push({
          kind: "line",
          x1: prev.x,
          y1: prev.y,
          x2: point.x,
          y2: point.y,
          stroke: "accent",
          opacity: 0.2,
        });
        prev = point;
      }
    }
    return ops;
  }
  if (pattern === "swirls") {
    // Dense hand-drawn spirals — same idea as a vintage textile print.
    // Cap count so a full A4 sheet stays printable without tens of thousands of strokes.
    const target = Math.min(140, Math.max(24, Math.round((w * h) / 2200)));
    const cell = Math.sqrt((w * h) / target);
    let i = 0;
    for (let row = 0; row * cell < h + cell; row++) {
      for (let col = 0; col * cell < w + cell; col++) {
        const jitterX = (hash01(i) - 0.5) * cell * 0.55;
        const jitterY = (hash01(i + 17) - 0.5) * cell * 0.55;
        const cx = r2(col * cell + cell * 0.5 + jitterX);
        const cy = r2(row * cell + cell * 0.5 + jitterY);
        const turns = r2(1.5 + hash01(i + 3) * 1.2);
        const spacing = r2(Math.max(3.4, cell * 0.12) + hash01(i + 9) * 2);
        const start = r2(hash01(i + 21) * Math.PI * 2);
        pushSpiral(ops, cx, cy, turns, spacing, start, 0.28 + hash01(i + 5) * 0.12);
        i++;
      }
    }
    return ops;
  }
  if (pattern === "waves") {
    const rowH = 14;
    const amp = 5;
    const wavelength = 28;
    for (let y0 = 6; y0 < h; y0 += rowH) {
      let prevX = 0;
      let prevY = y0;
      for (let x = 2; x <= w; x += 3) {
        const y = r2(y0 + Math.sin((x / wavelength) * Math.PI * 2) * amp);
        ops.push({
          kind: "line",
          x1: prevX,
          y1: prevY,
          x2: x,
          y2: y,
          stroke: "accent",
          weight: 0.9,
          opacity: 0.22,
        });
        prevX = x;
        prevY = y;
      }
    }
    return ops;
  }
  if (pattern === "lattice") {
    const step = 18;
    for (let x = 0; x <= w; x += step) {
      ops.push({ kind: "line", x1: x, y1: 0, x2: x, y2: h, stroke: "accent", weight: 0.6, opacity: 0.16 });
    }
    for (let y = 0; y <= h; y += step) {
      ops.push({ kind: "line", x1: 0, y1: y, x2: w, y2: y, stroke: "accent", weight: 0.6, opacity: 0.16 });
    }
    for (let y = 0; y <= h; y += step) {
      for (let x = 0; x <= w; x += step) {
        ops.push({ kind: "circle", cx: x, cy: y, r: 1.4, fill: "accent", opacity: 0.35 });
      }
    }
    return ops;
  }
  return ops;
}

function buildSurfaceOps(w: number, h: number, surface: SurfaceInput): DrawOp[] {
  if (surface.bgImage) {
    return [{ kind: "image", x: 0, y: 0, w, h, href: surface.bgImage, opacity: 0.92 }];
  }
  return buildPatternOps(surface.pattern, w, h);
}

/** A quiet typographic break — thin rules + a tiny diamond — instead of a
 * utility label like "FRONT". Reads as design, not instruction. */
function coverFlourish(cx: number, y: number, halfW: number): DrawOp[] {
  const tip = 3.2;
  return [
    { kind: "line", x1: cx - halfW, y1: y, x2: cx - tip * 1.6, y2: y, stroke: "accent", weight: 0.8, opacity: 0.7 },
    { kind: "line", x1: cx + tip * 1.6, y1: y, x2: cx + halfW, y2: y, stroke: "accent", weight: 0.8, opacity: 0.7 },
    { kind: "line", x1: cx, y1: y - tip, x2: cx + tip, y2: y, stroke: "accent", weight: 0.9, opacity: 0.85 },
    { kind: "line", x1: cx + tip, y1: y, x2: cx, y2: y + tip, stroke: "accent", weight: 0.9, opacity: 0.85 },
    { kind: "line", x1: cx, y1: y + tip, x2: cx - tip, y2: y, stroke: "accent", weight: 0.9, opacity: 0.85 },
    { kind: "line", x1: cx - tip, y1: y, x2: cx, y2: y - tip, stroke: "accent", weight: 0.9, opacity: 0.85 },
  ];
}

/**
 * Stacks title (+ optional subtitle) as centered lines that stay inside
 * maxWidth. When top/bottom are given, the block is vertically centered in
 * that band so large type keeps clear of the fold. Returns the baseline of
 * the last drawn line.
 */
function pushCoverCopy(
  ops: DrawOp[],
  opts: {
    cx: number;
    /** Used when top/bottom are omitted. */
    startY?: number;
    /** Inclusive band for vertical centering (preferred over startY). */
    top?: number;
    bottom?: number;
    title: string;
    subtitle: string;
    titleMaxWidth: number;
    subMaxWidth: number;
    preferredTitleSize: number;
    subtitleSize: number;
  },
): number {
  const titleText = opts.title.trim() || "·";
  const minSize = Math.max(9, Math.round(opts.preferredTitleSize * 0.55));
  const { lines: titleLines, size: titleSz } = fitWrappedText(
    titleText,
    opts.titleMaxWidth,
    opts.preferredTitleSize,
    "bold",
    3,
    minSize,
  );
  const titleLH = titleSz * 1.2;
  const sub = opts.subtitle.trim();
  const subSize = opts.subtitleSize;
  const subLines = sub ? wrapBookmarkText(sub, opts.subMaxWidth, subSize, "italic") : [];
  const subLH = subSize * 1.22;
  const subGap = subLines.length ? titleSz * 0.65 + 8 : 0;

  const blockH =
    Math.max(0, titleLines.length - 1) * titleLH +
    subGap +
    (subLines.length ? Math.max(0, subLines.length - 1) * subLH + subSize * 0.2 : titleSz * 0.15);

  let y: number;
  if (opts.top != null && opts.bottom != null) {
    const band = Math.max(0, opts.bottom - opts.top);
    const blockTopPad = titleSz * 0.85;
    y = opts.top + Math.max(0, (band - blockH - blockTopPad) / 2) + blockTopPad;
  } else {
    y = opts.startY ?? 0;
  }

  for (let i = 0; i < titleLines.length; i++) {
    ops.push({
      kind: "text",
      x: opts.cx,
      y,
      text: titleLines[i],
      size: titleSz,
      bold: true,
      color: "ink",
      align: "center",
    });
    if (i < titleLines.length - 1) y += titleLH;
  }

  if (subLines.length) {
    y += subGap;
    for (let i = 0; i < subLines.length; i++) {
      ops.push({
        kind: "text",
        x: opts.cx,
        y,
        text: subLines[i],
        size: subSize,
        italic: true,
        color: "secondary",
        align: "center",
      });
      if (i < subLines.length - 1) y += subLH;
    }
  }

  return y;
}

function buildCornerPlan(
  title: string,
  subtitle: string,
  surface: SurfaceInput,
  fontSize: FontSizeId,
  motif: MotifId,
): DrawOp[] {
  const w = 216;
  const h = 216;
  const cx = w / 2;
  const cy = h / 2;
  const sizes = preferredSizes(fontSize, title, "corner");
  const ops: DrawOp[] = [
    { kind: "rect", x: 0, y: 0, w, h, fill: "paper", stroke: "ink" },
    ...buildSurfaceOps(w, h, surface),
    { kind: "line", x1: 0, y1: 0, x2: w, y2: h, stroke: "mark", dashed: true },
    { kind: "line", x1: w, y1: 0, x2: 0, y2: h, stroke: "mark", dashed: true },
    // Fold reference marks, placed at each quadrant's centroid — always
    // strictly clear of both crease lines, never on top of them.
    { kind: "text", x: cx, y: cy / 2 + 4, text: "1", size: 8, color: "mark", align: "center" },
    { kind: "text", x: (cx + w) / 2, y: cy + 4, text: "2", size: 8, color: "mark", align: "center" },
    { kind: "text", x: cx / 2, y: cy + 4, text: "3", size: 8, color: "mark", align: "center" },
    ...buildCoverMotif(motif, cx, h * 0.58, 22),
  ];

  pushCoverCopy(ops, {
    cx,
    top: h * 0.76,
    bottom: h * 0.96,
    title,
    subtitle,
    titleMaxWidth: w * 0.5,
    subMaxWidth: w * 0.58,
    preferredTitleSize: sizes.title,
    subtitleSize: sizes.subtitle,
  });

  return ops;
}

/**
 * A whole-sheet accordion fold: no cutting at all.
 *
 * Vertical (default): horizontal creases fan-fold the page top→bottom into a
 * thick landscape strip. Cover prints full-width on the bottom panel — fold
 * and use, no extra half-fold.
 *
 * Sideways: vertical creases fan-fold left→right, then one horizontal crease
 * halves the height.
 *
 * Fold lines are numbered in the order they should be made.
 */
function buildAccordionPlan(
  w: number,
  h: number,
  title: string,
  subtitle: string,
  surface: SurfaceInput,
  fontSize: FontSizeId,
  motif: MotifId,
  panelCount: AccordionPanels,
  direction: AccordionDirection,
): DrawOp[] {
  const vertical = direction === "vertical";
  const midY = h / 2;
  const panelH = h / panelCount;
  const panelW = w / panelCount;

  // Vertical: full-width landscape cover on the bottom panel.
  // Sideways: tall cover on the top-right panel half.
  const cellX0 = vertical ? 0 : (panelCount - 1) * panelW;
  const cellY0 = vertical ? (panelCount - 1) * panelH : 0;
  const cellW = vertical ? w : panelW;
  const cellH = vertical ? panelH : midY;
  const cellMidX = cellX0 + cellW / 2;
  const cellMidY = cellY0 + cellH / 2;
  const sizes = preferredSizes(fontSize, title, "accordion");

  const foldClearX = Math.max(14, Math.min(cellW * 0.08, sizes.title * 0.95));
  const foldClearY = Math.max(12, Math.min(cellH * 0.16, sizes.title * 1.0));
  const edgeClear = Math.max(22, Math.min(cellH * 0.22, sizes.title * 1.35));

  const ops: DrawOp[] = [{ kind: "rect", x: 0, y: 0, w, h, fill: "paper", stroke: "ink" }];

  if (surface.bgImage) {
    ops.push({
      kind: "image",
      x: cellX0,
      y: cellY0,
      w: cellW,
      h: cellH,
      href: surface.bgImage,
      opacity: 1,
    });
  } else {
    ops.push(...buildPatternOps(surface.pattern, w, h));
  }

  if (vertical) {
    // Fan-fold only — no final half-fold. Cover is already landscape-ready.
    for (let i = 1; i < panelCount; i++) {
      const y = i * panelH;
      ops.push({ kind: "line", x1: 8, y1: y, x2: w - 8, y2: y, stroke: "mark", dashed: true });
      ops.push({
        kind: "text",
        x: 12,
        y: y - 6,
        text: String(i),
        size: 9,
        color: "mark",
        align: "left",
      });
    }
  } else {
    for (let i = 1; i < panelCount; i++) {
      const x = i * panelW;
      ops.push({ kind: "line", x1: x, y1: 8, x2: x, y2: h - 8, stroke: "mark", dashed: true });
      ops.push({
        kind: "text",
        x: x + 6,
        y: 20,
        text: String(i),
        size: 9,
        color: "mark",
        align: "left",
      });
    }
    ops.push({
      kind: "line",
      x1: 6,
      y1: midY,
      x2: w - 6,
      y2: midY,
      stroke: "accent",
      dashed: true,
      weight: 1.6,
    });
    ops.push({
      kind: "text",
      x: 10,
      y: midY - 8,
      text: String(panelCount),
      size: 9,
      bold: true,
      color: "accent",
      align: "left",
    });
  }

  const hasMotif = motif !== "none";
  // Landscape cover: motif sits beside the words so the short strip stays readable.
  if (vertical) {
    const motifScale = Math.min(cellH * 0.42, 36);
    const motifSlot = hasMotif ? motifScale * 1.7 : 0;
    const padX = Math.max(24, foldClearX);
    const textLeft = cellX0 + padX + motifSlot;
    const textRight = cellX0 + cellW - padX;
    const textCx = (textLeft + textRight) / 2;
    const copyMax = Math.max(48, textRight - textLeft);
    const bandTop = cellY0 + edgeClear;
    const bandBot = cellY0 + cellH - foldClearY;

    ops.push({
      kind: "rect",
      x: cellX0 + padX * 0.45,
      y: cellY0 + Math.max(10, foldClearY * 0.45),
      w: cellW - padX * 0.9,
      h: cellH - Math.max(20, foldClearY * 0.9),
      fill: "paper",
      opacity: surface.bgImage ? 0.55 : 0.72,
    });

    ops.push(...coverFlourish(textCx, bandTop - sizes.title * 0.55, Math.min(40, copyMax * 0.18)));

    pushCoverCopy(ops, {
      cx: textCx,
      top: bandTop,
      bottom: bandBot - (hasMotif ? 0 : sizes.title * 0.15),
      title,
      subtitle,
      titleMaxWidth: copyMax,
      subMaxWidth: copyMax,
      preferredTitleSize: sizes.title,
      subtitleSize: sizes.subtitle,
    });

    if (hasMotif) {
      const motifCx = cellX0 + padX + motifScale * 0.65;
      ops.push(...buildCoverMotif(motif, motifCx, cellMidY, motifScale));
    }

    ops.push(...coverFlourish(textCx, bandBot + sizes.title * 0.15, Math.min(28, copyMax * 0.12)));
    return ops;
  }

  // Sideways cover (tall narrow panel) — stacked layout.
  const bandTop = cellY0 + edgeClear;
  const bandBot = cellY0 + cellH - foldClearY;
  const panelTop = bandTop - sizes.title * 0.45;
  const panelBot = Math.min(cellY0 + cellH - 8, bandBot + Math.max(10, sizes.title * 0.3));
  ops.push({
    kind: "rect",
    x: cellX0 + foldClearX * 0.55,
    y: panelTop,
    w: cellW - foldClearX * 1.1,
    h: Math.max(20, panelBot - panelTop),
    fill: "paper",
    opacity: surface.bgImage ? 0.55 : 0.72,
  });

  ops.push(
    ...coverFlourish(
      cellMidX,
      Math.max(cellY0 + 16, bandTop - sizes.title * 0.85),
      Math.min(34, cellW * 0.22),
    ),
  );

  const motifScale = Math.min(cellW * 0.34, cellH * 0.22, 28);
  const motifH = hasMotif ? motifScale * motifHeightFactor(motif) : 0;
  const gapTextToMotif = hasMotif ? Math.max(14, sizes.title * 0.55) : 0;
  const gapMotifToDivider = hasMotif ? Math.max(10, motifScale * 0.35) : Math.max(8, sizes.title * 0.4);
  const bottomFlourishY = Math.min(bandBot, cellY0 + cellH - Math.max(12, foldClearY * 0.35));
  const copyBottom = Math.max(
    bandTop + sizes.title * 1.6,
    bottomFlourishY - gapMotifToDivider - motifH - gapTextToMotif,
  );

  const copyMax = Math.max(36, cellW - foldClearX * 2);
  const lastY = pushCoverCopy(ops, {
    cx: cellMidX,
    top: bandTop,
    bottom: copyBottom,
    title,
    subtitle,
    titleMaxWidth: copyMax,
    subMaxWidth: copyMax,
    preferredTitleSize: sizes.title,
    subtitleSize: sizes.subtitle,
  });

  if (hasMotif) {
    const motifTop = lastY + gapTextToMotif;
    const motifBot = bottomFlourishY - gapMotifToDivider;
    if (motifBot - motifTop >= motifScale * 1.2) {
      const motifCy = r2(motifTop + motifScale * 0.5);
      ops.push(...buildCoverMotif(motif, cellMidX, motifCy, motifScale));
    }
  }

  ops.push(...coverFlourish(cellMidX, bottomFlourishY, Math.min(22, cellW * 0.16)));

  return ops;
}

export function buildUnitPlan(
  shape: Shape,
  title: string,
  subtitle: string,
  pattern: PatternId,
  paperSize: PaperSize,
  bgImage?: string | null,
  fontSize: FontSizeId = "md",
  motif: MotifId = "panda",
  accordionPanels?: AccordionPanels,
  accordionDirection: AccordionDirection = "vertical",
): UnitPlan {
  const size = getUnitSize(shape, paperSize);
  const surface: SurfaceInput = { pattern, bgImage: bgImage ?? null };
  if (shape === "corner") {
    return {
      shape,
      size,
      cutOutline: { x: 0, y: 0, w: size.w, h: size.h },
      foldCount: 2,
      ops: buildCornerPlan(title, subtitle, surface, fontSize, motif),
    };
  }
  const panelCount = accordionPanels ?? suggestedAccordionPanels(paperSize, accordionDirection);
  // Vertical: fan-folds only. Sideways: fan-folds + final half-fold.
  const foldCount = accordionDirection === "vertical" ? panelCount - 1 : panelCount;
  return {
    shape,
    size,
    cutOutline: { x: 0, y: 0, w: size.w, h: size.h },
    foldCount,
    ops: buildAccordionPlan(
      size.w,
      size.h,
      title,
      subtitle,
      surface,
      fontSize,
      motif,
      panelCount,
      accordionDirection,
    ),
  };
}
