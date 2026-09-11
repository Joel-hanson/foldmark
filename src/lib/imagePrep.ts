/** Client-side image prep: compress, cover-crop with pan/zoom. */

export const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

export type ImageCrop = {
  /** Zoom ≥ 1. */
  zoom: number;
  /** Pan of crop center, −1…1 relative to available slack. */
  x: number;
  /** Pan of crop center, −1…1 relative to available slack. */
  y: number;
};

export const DEFAULT_CROP: ImageCrop = { zoom: 1, x: 0, y: 0 };

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read file"));
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });
}

/** Shrink so the longest edge ≤ maxEdge, output JPEG. */
export async function compressImageDataUrl(
  dataUrl: string,
  maxEdge = 1800,
  quality = 0.88,
): Promise<string> {
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Cover-crop `source` into `outW`×`outH` using zoom + pan, matching the
 * PDF object-fit:cover math so the maker preview and print stay honest.
 */
export async function cropCoverDataUrl(
  source: string,
  outW: number,
  outH: number,
  crop: ImageCrop = DEFAULT_CROP,
  quality = 0.9,
): Promise<string> {
  const img = await loadImage(source);
  const zoom = Math.max(1, Math.min(3, crop.zoom));
  const base = Math.max(outW / img.naturalWidth, outH / img.naturalHeight);
  const scale = base * zoom;
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  const slackX = Math.max(0, drawW - outW);
  const slackY = Math.max(0, drawH - outH);
  const panX = Math.max(-1, Math.min(1, crop.x));
  const panY = Math.max(-1, Math.min(1, crop.y));
  const offsetX = -slackX / 2 + (panX * slackX) / 2;
  const offsetY = -slackY / 2 + (panY * slackY) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Target crop canvas size for a bookmark face (enough for print). */
export function cropOutputSize(shape: "accordion" | "corner"): { w: number; h: number } {
  if (shape === "corner") return { w: 900, h: 900 };
  // Landscape accordion cover panel — roughly 3:1-ish on A4 vertical folds.
  return { w: 1400, h: 500 };
}
