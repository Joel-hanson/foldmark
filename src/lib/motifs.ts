import type { MotifId } from "./types";
import type { DrawOp } from "./unitPlan";

/**
 * Cover motifs as minimal line-art animal faces — front-on, uniform stroke,
 * dot eyes, round heads. Same language as cute icon sets (Mandai-adjacent
 * merch faces). Local box ≈ 80×80; `scale` ≈ half-width in points.
 */

function stroke(
  d: string,
  cx: number,
  cy: number,
  s: number,
  weight = 2.2,
  opacity = 0.92,
): DrawOp {
  return { kind: "path", d, x: cx, y: cy, scale: s, stroke: "accent", weight, opacity };
}

function fill(
  d: string,
  cx: number,
  cy: number,
  s: number,
  opacity = 0.92,
): DrawOp {
  return { kind: "path", d, x: cx, y: cy, scale: s, fill: "accent", opacity };
}

/** Solid eye dots (filled circles). */
function eyes(cx: number, cy: number, s: number, y = -4, spread = 11, r = 2.4): DrawOp[] {
  const L = `M ${-spread} ${y} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
  const R = `M ${spread} ${y} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
  return [fill(L, cx, cy, s), fill(R, cx, cy, s)];
}

function r2(n: number) {
  return Math.round(n * 100) / 100;
}

function rot(x: number, y: number, a: number): [number, number] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [r2(x * c - y * s), r2(x * s + y * c)];
}

function petal(angle: number, len: number): string {
  const lift = len * 0.28;
  const pts: [number, number][] = [
    [0, -lift],
    [len * 0.5, -lift - len * 0.2],
    [len * 0.34, -lift - len * 0.72],
    [0, -lift - len],
    [-len * 0.34, -lift - len * 0.72],
    [-len * 0.5, -lift - len * 0.2],
  ].map(([x, y]) => rot(x, y, angle));
  const [a, b, c, d, e, f] = pts;
  return `M ${a[0]} ${a[1]} C ${b[0]} ${b[1]} ${c[0]} ${c[1]} ${d[0]} ${d[1]} C ${e[0]} ${e[1]} ${f[0]} ${f[1]} ${a[0]} ${a[1]}`;
}

/** Line-art flower face companion — keeps botanical option. */
function flowerMotif(cx: number, cy: number, scale: number): DrawOp[] {
  const s = Math.max(0.28, scale / 36);
  const petals = Array.from({ length: 5 }, (_, i) => petal((i / 5) * Math.PI * 2, 16)).join(" ");
  const center = `M 0 0 m -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0`;
  const stem = `M 0 18 L 0 48`;
  const leafL = `M 0 32 C -12 28 -16 36 -8 40`;
  const leafR = `M 0 38 C 12 34 16 42 8 46`;
  return [
    stroke(petals, cx, cy, s, 2.0),
    fill(center, cx, cy, s, 0.85),
    stroke(`${stem} ${leafL} ${leafR}`, cx, cy, s, 2.0),
  ];
}

/** Panda — round head, round ears, eye patches, tiny nose. */
function pandaMotif(cx: number, cy: number, scale: number): DrawOp[] {
  const s = Math.max(0.3, scale / 36);
  const head = `M 0 0 m -28 0 a 28 26 0 1 0 56 0 a 28 26 0 1 0 -56 0`;
  const earL = `M -20 -22 m -9 0 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0`;
  const earR = `M 20 -22 m -9 0 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0`;
  const patchL = `M -12 -2 m -8 0 a 8 9 0 1 0 16 0 a 8 9 0 1 0 -16 0`;
  const patchR = `M 12 -2 m -8 0 a 8 9 0 1 0 16 0 a 8 9 0 1 0 -16 0`;
  const nose = `M 0 10 m -3.5 0 a 3.5 2.8 0 1 0 7 0 a 3.5 2.8 0 1 0 -7 0`;
  const smile = `M -6 16 Q 0 20 6 16`;
  return [
    stroke(`${earL} ${earR} ${head}`, cx, cy, s),
    stroke(`${patchL} ${patchR}`, cx, cy, s, 2.0),
    fill(nose, cx, cy, s, 0.9),
    stroke(smile, cx, cy, s, 2.0),
    ...eyes(cx, cy, s, -2, 12, 2.2),
  ];
}

/** Elephant — big ear loops, trunk curling aside, dot eyes. */
function elephantMotif(cx: number, cy: number, scale: number): DrawOp[] {
  const s = Math.max(0.3, scale / 36);
  const head = `M 0 2 m -22 0 a 22 20 0 1 0 44 0 a 22 20 0 1 0 -44 0`;
  const earL = `M -18 -4 C -34 -14 -38 10 -24 16 C -18 8 -16 2 -18 -4`;
  const earR = `M 18 -4 C 34 -14 38 10 24 16 C 18 8 16 2 18 -4`;
  const trunk = `M 2 16 C 4 28 0 40 -8 44 C -14 46 -16 40 -12 36 C -6 30 0 24 2 16`;
  const smile = `M -8 12 Q 0 14 4 12`;
  return [
    stroke(`${earL} ${earR} ${head} ${trunk}`, cx, cy, s),
    stroke(smile, cx, cy, s, 2.0),
    ...eyes(cx, cy, s, -4, 10, 2.3),
  ];
}

/** Giraffe — ossicones, ear flaps, cheek spots, longish muzzle. */
function giraffeMotif(cx: number, cy: number, scale: number): DrawOp[] {
  const s = Math.max(0.3, scale / 36);
  const head = `M 0 2 m -20 0 a 20 22 0 1 0 40 0 a 20 22 0 1 0 -40 0`;
  const hornL = `M -8 -22 L -8 -34 M -11 -34 L -5 -34`;
  const hornR = `M 8 -22 L 8 -34 M 5 -34 L 11 -34`;
  const earL = `M -16 -16 C -26 -20 -28 -8 -20 -6`;
  const earR = `M 16 -16 C 26 -20 28 -8 20 -6`;
  const muzzle = `M -10 12 C -10 22 10 22 10 12`;
  const nostrils = `M -4 16 m -1.5 0 a 1.5 1.5 0 1 0 3 0 a 1.5 1.5 0 1 0 -3 0 M 4 16 m -1.5 0 a 1.5 1.5 0 1 0 3 0 a 1.5 1.5 0 1 0 -3 0`;
  const spots = `M -14 0 m -2.5 0 a 2.5 2 0 1 0 5 0 a 2.5 2 0 1 0 -5 0 M 14 2 m -2.5 0 a 2.5 2 0 1 0 5 0 a 2.5 2 0 1 0 -5 0 M -12 8 m -2 0 a 2 1.6 0 1 0 4 0 a 2 1.6 0 1 0 -4 0`;
  return [
    stroke(`${head} ${hornL} ${hornR} ${earL} ${earR} ${muzzle}`, cx, cy, s),
    fill(nostrils, cx, cy, s, 0.9),
    fill(spots, cx, cy, s, 0.85),
    ...eyes(cx, cy, s, -6, 9, 2.2),
  ];
}

/** Fox — pointed ears, diamond muzzle, whiskers. */
function foxMotif(cx: number, cy: number, scale: number): DrawOp[] {
  const s = Math.max(0.3, scale / 36);
  const head = `M 0 4 m -24 0 a 24 22 0 1 0 48 0 a 24 22 0 1 0 -48 0`;
  const earL = `M -14 -18 L -22 -36 L -4 -22 Z`;
  const earR = `M 14 -18 L 22 -36 L 4 -22 Z`;
  const muzzle = `M -8 8 L 0 18 L 8 8`;
  const nose = `M 0 14 m -2.2 0 a 2.2 1.8 0 1 0 4.4 0 a 2.2 1.8 0 1 0 -4.4 0`;
  const whiskers = `M -10 10 L -22 6 M -10 14 L -22 14 M 10 10 L 22 6 M 10 14 L 22 14`;
  return [
    stroke(`${earL} ${earR} ${head} ${muzzle} ${whiskers}`, cx, cy, s),
    fill(nose, cx, cy, s, 0.9),
    ...eyes(cx, cy, s, -4, 10, 2.3),
  ];
}

/** Rabbit — tall ears, round head, tiny nose, whiskers. */
function rabbitMotif(cx: number, cy: number, scale: number): DrawOp[] {
  const s = Math.max(0.28, scale / 38);
  const head = `M 0 8 m -24 0 a 24 22 0 1 0 48 0 a 24 22 0 1 0 -48 0`;
  const earL = `M -10 -12 C -14 -40 -4 -46 0 -20`;
  const earR = `M 10 -12 C 14 -40 4 -46 0 -20`;
  const innerL = `M -8 -14 C -10 -32 -4 -34 -2 -18`;
  const innerR = `M 8 -14 C 10 -32 4 -34 2 -18`;
  const nose = `M 0 12 C -4 12 -5 16 -2 18 C 0 19 0 19 2 18 C 5 16 4 12 0 12 Z`;
  const smile = `M -5 20 Q 0 24 5 20`;
  const whiskers = `M -8 14 L -20 10 M -8 18 L -20 18 M 8 14 L 20 10 M 8 18 L 20 18`;
  return [
    stroke(`${earL} ${earR} ${innerL} ${innerR} ${head} ${smile} ${whiskers}`, cx, cy, s),
    fill(nose, cx, cy, s, 0.9),
    ...eyes(cx, cy, s, 2, 10, 2.3),
  ];
}

/** Penguin — oval head, beak triangle, blush marks. */
function penguinMotif(cx: number, cy: number, scale: number): DrawOp[] {
  const s = Math.max(0.3, scale / 36);
  const head = `M 0 0 m -26 0 a 26 28 0 1 0 52 0 a 26 28 0 1 0 -52 0`;
  const beak = `M -6 6 L 0 14 L 6 6 Z`;
  const blushL = `M -16 8 m -3 0 a 3 2 0 1 0 6 0 a 3 2 0 1 0 -6 0`;
  const blushR = `M 16 8 m -3 0 a 3 2 0 1 0 6 0 a 3 2 0 1 0 -6 0`;
  return [
    stroke(head, cx, cy, s),
    stroke(beak, cx, cy, s, 2.0),
    fill(beak, cx, cy, s, 0.2),
    fill(`${blushL} ${blushR}`, cx, cy, s, 0.25),
    ...eyes(cx, cy, s, -6, 10, 2.5),
  ];
}

/** Bear — round ears, round snout oval, friendly face. */
function bearMotif(cx: number, cy: number, scale: number): DrawOp[] {
  const s = Math.max(0.3, scale / 36);
  const head = `M 0 2 m -26 0 a 26 24 0 1 0 52 0 a 26 24 0 1 0 -52 0`;
  const earL = `M -18 -18 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0`;
  const earR = `M 18 -18 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0`;
  const snout = `M 0 8 m -10 0 a 10 8 0 1 0 20 0 a 10 8 0 1 0 -20 0`;
  const nose = `M 0 6 m -2.5 0 a 2.5 2 0 1 0 5 0 a 2.5 2 0 1 0 -5 0`;
  const smile = `M -5 12 Q 0 16 5 12`;
  return [
    stroke(`${earL} ${earR} ${head} ${snout} ${smile}`, cx, cy, s),
    fill(nose, cx, cy, s, 0.9),
    ...eyes(cx, cy, s, -6, 11, 2.3),
  ];
}

/** Monstera-ish leaf — simple line botanical. */
function leafMotif(cx: number, cy: number, scale: number): DrawOp[] {
  const s = Math.max(0.3, scale / 36);
  const outline = [
    `M 0 32`,
    `C -4 12 -2 -4 0 -20`,
    `C -18 -16 -30 0 -28 16`,
    `C -26 28 -14 34 -4 30`,
    `M 0 -20`,
    `C 18 -16 30 0 28 16`,
    `C 26 28 14 34 4 30`,
    `C 2 20 0 10 0 32`,
  ].join(" ");
  const midrib = `M 0 -18 L 0 32`;
  const slits = `M -12 0 L -6 0 M -14 12 L -6 12 M 6 0 L 12 0 M 6 12 L 14 12`;
  return [stroke(`${outline} ${midrib} ${slits}`, cx, cy, s, 2.1)];
}

export function buildCoverMotif(id: MotifId, cx: number, cy: number, scale: number): DrawOp[] {
  switch (id) {
    case "flower":
      return flowerMotif(cx, cy, scale);
    case "panda":
      return pandaMotif(cx, cy, scale);
    case "elephant":
      return elephantMotif(cx, cy, scale);
    case "giraffe":
      return giraffeMotif(cx, cy, scale);
    case "fox":
      return foxMotif(cx, cy, scale);
    case "rabbit":
      return rabbitMotif(cx, cy, scale);
    case "penguin":
      return penguinMotif(cx, cy, scale);
    case "bear":
      return bearMotif(cx, cy, scale);
    case "leaf":
      return leafMotif(cx, cy, scale);
    case "none":
    default:
      return [];
  }
}

export function motifHeightFactor(id: MotifId): number {
  if (id === "none") return 0;
  // Faces are compact — less vertical room than full-body drawings.
  if (id === "rabbit") return 1.55;
  if (id === "flower" || id === "leaf") return 1.6;
  return 1.35;
}
