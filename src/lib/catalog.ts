import type { MotifId, MotifInfo, Palette, PatternId, PatternInfo, PhrasePreset, Shape, ShapeInfo } from "./types";

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
    howTo: "Fan-fold the numbered lines, then make the final fold.",
  },
  {
    id: "corner",
    name: "Corner pocket",
    blurb: "Slides over the page corner.",
    howTo: "Cut the square, then fold twice into a pocket.",
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
];

export const MOTIFS: MotifInfo[] = [
  { id: "none", name: "None" },
  { id: "flower", name: "Flower" },
  { id: "panda", name: "Panda" },
  { id: "elephant", name: "Elephant" },
  { id: "giraffe", name: "Giraffe" },
  { id: "fox", name: "Fox" },
  { id: "rabbit", name: "Rabbit" },
  { id: "penguin", name: "Penguin" },
  { id: "bear", name: "Bear" },
  { id: "leaf", name: "Leaf" },
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
