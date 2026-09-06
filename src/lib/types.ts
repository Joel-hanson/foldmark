export type Shape = "accordion" | "corner";

/** How many accordion panels (plus one final finish fold). */
export type AccordionPanels = 3 | 4 | 5 | 6;

/**
 * Accordion fold direction:
 * - vertical — fan-fold top→bottom; landscape cover, no half-fold
 * - sideways — fan-fold left→right, then one height fold
 */
export type AccordionDirection = "vertical" | "sideways";

export type PatternId = "none" | "stripes" | "polka" | "chevron" | "swirls" | "waves" | "lattice";

export type MotifId =
  | "none"
  | "flower"
  | "panda"
  | "elephant"
  | "giraffe"
  | "fox"
  | "rabbit"
  | "penguin"
  | "bear"
  | "leaf";

export type PaperSize = "a4" | "letter" | "a5" | "legal";
export type PrintMode = "color" | "bw";

/** How the bookmark face is filled — a generated pattern, or a user image. */
export type SurfaceMode = "pattern" | "image";

export type FontId = "cormorant" | "baskerville" | "lora" | "playfair" | "fraunces";

/** Relative size of the cover title. */
export type FontSizeId = "sm" | "md" | "lg" | "xl";

export type Palette = {
  id: string;
  name: string;
  paper: string;
  ink: string;
  accent: string;
  secondary: string;
};

export type DesignState = {
  shape: Shape;
  title: string;
  subtitle: string;
  paletteId: string;
  pattern: PatternId;
  /** Small cover ornament under the title. */
  motif: MotifId;
  surfaceMode: SurfaceMode;
  /** data: URL of an uploaded image; only used when surfaceMode === "image". */
  bgImage: string | null;
  fontId: FontId;
  fontSize: FontSizeId;
  /** Accordion only — fewer panels means wider folds / fewer creases. */
  accordionPanels: AccordionPanels;
  /** Accordion only — fan-fold down the page (easier) or across. */
  accordionDirection: AccordionDirection;
  paperSize: PaperSize;
  printMode: PrintMode;
};

export type ShapeInfo = {
  id: Shape;
  name: string;
  blurb: string;
  howTo: string;
};

export type PatternInfo = {
  id: PatternId;
  name: string;
};

export type MotifInfo = {
  id: MotifId;
  name: string;
};

export type PhrasePreset = {
  title: string;
  subtitle: string;
};

export type FontInfo = {
  id: FontId;
  name: string;
  family: string;
  /** CSS fallback stack after the primary family name. */
  fallback: string;
};

export type FontSizeInfo = {
  id: FontSizeId;
  name: string;
};
