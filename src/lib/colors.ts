import type { PrintMode } from "./types";
import { getPalette } from "./catalog";

export type ResolvedColors = {
  paper: string;
  ink: string;
  accent: string;
  secondary: string;
  mark: string;
};

function luminance(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Single source of truth for palette + black/white resolution. Used by both the
 * on-screen preview and the PDF, so colors can never drift between the two. */
export function resolveColors(paletteId: string, printMode: PrintMode): ResolvedColors {
  const palette = getPalette(paletteId);
  if (printMode === "bw") {
    const darkPaper = luminance(palette.paper) < 0.45;
    return {
      paper: darkPaper ? "#FFFFFF" : "#F4F2EC",
      ink: "#1F1F1F",
      accent: "#333333",
      secondary: "#737373",
      mark: "#8C8C8C",
    };
  }
  return {
    paper: palette.paper,
    ink: palette.ink,
    accent: palette.accent,
    secondary: palette.secondary,
    mark: "#8C8C8C",
  };
}
