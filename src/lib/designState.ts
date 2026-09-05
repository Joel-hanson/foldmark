import type { DesignState, FontId, FontSizeId, MotifId, PaperSize, PatternId, Shape, SurfaceMode } from "./types";

const SHAPES: Shape[] = ["accordion", "corner"];
const PAPER_IDS: PaperSize[] = ["a4", "letter", "a5", "legal"];
const PATTERNS: PatternId[] = ["none", "stripes", "polka", "chevron", "swirls", "waves", "lattice"];
const MOTIFS: MotifId[] = [
  "none",
  "flower",
  "panda",
  "elephant",
  "giraffe",
  "fox",
  "rabbit",
  "penguin",
  "bear",
  "leaf",
];
const SURFACES: SurfaceMode[] = ["pattern", "image"];
const FONTS: FontId[] = ["cormorant", "baskerville", "lora", "playfair", "fraunces"];
const FONT_SIZES: FontSizeId[] = ["sm", "md", "lg", "xl"];

export function defaultDesign(): DesignState {
  return {
    shape: "accordion",
    title: "keep going",
    subtitle: "",
    paletteId: "ink",
    pattern: "swirls",
    motif: "panda",
    surfaceMode: "pattern",
    bgImage: null,
    fontId: "cormorant",
    fontSize: "md",
    paperSize: "a4",
    printMode: "color",
  };
}

export function designToQuery(design: DesignState): string {
  const params = new URLSearchParams({
    shape: design.shape,
    title: design.title,
    sub: design.subtitle,
    p: design.paletteId,
    pat: design.pattern,
    motif: design.motif,
    surface: design.surfaceMode,
    font: design.fontId,
    fs: design.fontSize,
    paper: design.paperSize,
    mode: design.printMode,
  });
  // Uploaded images stay in memory / sessionStorage — too large for the URL.
  return params.toString();
}

export function designFromQuery(search: string): DesignState | null {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (![...q.keys()].length) return null;
  const base = defaultDesign();
  const shape = q.get("shape");
  const paper = q.get("paper") ?? base.paperSize;
  const pattern = q.get("pat");
  const motif = q.get("motif");
  const surface = q.get("surface");
  const font = q.get("font");
  const fs = q.get("fs");
  return {
    shape: SHAPES.includes(shape as Shape) ? (shape as Shape) : base.shape,
    title: q.get("title") ?? base.title,
    subtitle: q.get("sub") ?? base.subtitle,
    paletteId: q.get("p") ?? base.paletteId,
    pattern: PATTERNS.includes(pattern as PatternId) ? (pattern as PatternId) : base.pattern,
    motif: MOTIFS.includes(motif as MotifId) ? (motif as MotifId) : base.motif,
    surfaceMode: SURFACES.includes(surface as SurfaceMode) ? (surface as SurfaceMode) : base.surfaceMode,
    bgImage: null,
    fontId: FONTS.includes(font as FontId) ? (font as FontId) : base.fontId,
    fontSize: FONT_SIZES.includes(fs as FontSizeId) ? (fs as FontSizeId) : base.fontSize,
    paperSize: PAPER_IDS.includes(paper as PaperSize) ? (paper as PaperSize) : base.paperSize,
    printMode: q.get("mode") === "bw" ? "bw" : "color",
  };
}
