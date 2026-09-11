import type {
  AccordionDirection,
  AccordionPanels,
  MotifId,
  MotifInfo,
  Palette,
  PatternId,
  PatternInfo,
  PhrasePreset,
  Shape,
  ShapeInfo,
} from "./types";

/** Accordion fan-fold panel counts — fewer = thicker easier folds. */
export const ACCORDION_PANEL_OPTIONS: AccordionPanels[] = [3, 4, 5, 6];

export const ACCORDION_DIRECTION_OPTIONS: { id: AccordionDirection; name: string; blurb: string }[] = [
  { id: "vertical", name: "Fold down", blurb: "Fan-fold top to bottom — cover is ready, no half-fold" },
  { id: "sideways", name: "Fold across", blurb: "Left to right, then fold in half" },
];

export const PALETTES: Palette[] = [
  {
    id: "ink",
    name: "Printer ink",
    paper: "#F4F2EC",
    ink: "#1C1F1C",
    accent: "#2C4A3E",
    secondary: "#8A8F84",
  },
  {
    id: "seawall",
    name: "Seawall",
    paper: "#E8EEF0",
    ink: "#1A2A32",
    accent: "#3D6B7A",
    secondary: "#7A929C",
  },
  {
    id: "clay",
    name: "Clay & olive",
    paper: "#F3EDE4",
    ink: "#2A241E",
    accent: "#6B4E3D",
    secondary: "#9A8B78",
  },
  {
    id: "night",
    name: "Night press",
    paper: "#1E2420",
    ink: "#F0EEE6",
    accent: "#A8C3B0",
    secondary: "#8B948C",
  },
  {
    id: "maple",
    name: "Maple",
    paper: "#F6EFE6",
    ink: "#3A2A1E",
    accent: "#A45A3A",
    secondary: "#9A7B62",
  },
];

export const SHAPES: ShapeInfo[] = [
  {
    id: "accordion",
    name: "Accordion fold",
    blurb: "The whole sheet, fan-folded thick. No cutting.",
    howTo: "Fan-fold down the numbered lines — cover is ready, no extra fold.",
  },
  {
    id: "corner",
    name: "Corner pocket",
    blurb: "Cut a square, fold twice, slide over the page corner.",
    howTo: "Cut the outer square, then fold on lines 1 and 2 into a pocket.",
  },
];

export const PATTERNS: PatternInfo[] = [
  { id: "none", name: "Plain" },
  { id: "stripes", name: "Stripes" },
  { id: "polka", name: "Polka" },
  { id: "chevron", name: "Chevron" },
  { id: "swirls", name: "Swirls" },
  { id: "waves", name: "Waves" },
  { id: "lattice", name: "Lattice" },
  { id: "buta", name: "Saree buta" },
];

export const MOTIFS: MotifInfo[] = [
  { id: "none", name: "None" },
  { id: "flower", name: "Flower" },
  { id: "flowerAlt", name: "Flower alt" },
  { id: "leaf", name: "Leaf" },
  { id: "leafAlt", name: "Leaf alt" },
  { id: "panda", name: "Panda" },
  { id: "pandaAlt", name: "Panda alt" },
  { id: "elephant", name: "Elephant" },
  { id: "elephantAlt", name: "Elephant alt" },
  { id: "giraffe", name: "Giraffe" },
  { id: "giraffeAlt", name: "Giraffe alt" },
  { id: "fox", name: "Fox" },
  { id: "foxAlt", name: "Fox alt" },
  { id: "rabbit", name: "Rabbit" },
  { id: "rabbitAlt", name: "Rabbit alt" },
  { id: "penguin", name: "Penguin" },
  { id: "penguinAlt", name: "Penguin alt" },
  { id: "bear", name: "Bear" },
  { id: "bearAlt", name: "Bear alt" },
];

/** Short phrases that read like a private note, not a product label. */
export const PHRASE_PRESETS: PhrasePreset[] = [
  { title: "keep going", subtitle: "" },
  { title: "left off here", subtitle: "" },
  { title: "one more page", subtitle: "" },
  { title: "hold this place", subtitle: "" },
  { title: "before sleep", subtitle: "" },
  { title: "again tomorrow", subtitle: "" },
  { title: "chapter break", subtitle: "" },
  { title: "find me", subtitle: "right here" },
];

/** One-tap looks — palette + pattern + motif + phrase together. */
export type LookPreset = {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  paletteId: string;
  pattern: PatternId;
  motif: MotifId;
};

export const LOOK_PRESETS: LookPreset[] = [
  {
    id: "quiet-ink",
    name: "Quiet ink",
    title: "keep going",
    subtitle: "",
    paletteId: "ink",
    pattern: "swirls",
    motif: "none",
  },
  {
    id: "night-read",
    name: "Night read",
    title: "before sleep",
    subtitle: "",
    paletteId: "night",
    pattern: "waves",
    motif: "fox",
  },
  {
    id: "maple-note",
    name: "Maple note",
    title: "left off here",
    subtitle: "",
    paletteId: "maple",
    pattern: "buta",
    motif: "leaf",
  },
  {
    id: "seawall",
    name: "Seawall",
    title: "one more page",
    subtitle: "",
    paletteId: "seawall",
    pattern: "stripes",
    motif: "none",
  },
  {
    id: "clay-friend",
    name: "Clay friend",
    title: "find me",
    subtitle: "right here",
    paletteId: "clay",
    pattern: "polka",
    motif: "bear",
  },
];

export const PAPER_LABELS: Record<string, string> = {
  a4: "A4",
  letter: "US Letter",
  a5: "A5",
  legal: "Legal",
};

export function getPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

export function getShapeInfo(id: Shape): ShapeInfo {
  return SHAPES.find((s) => s.id === id) ?? SHAPES[0];
}

export function getPatternInfo(id: PatternId): PatternInfo {
  return PATTERNS.find((p) => p.id === id) ?? PATTERNS[0];
}

export function getMotifInfo(id: MotifId): MotifInfo {
  return MOTIFS.find((m) => m.id === id) ?? MOTIFS[0];
}
