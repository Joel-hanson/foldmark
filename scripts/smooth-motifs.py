#!/usr/bin/env python3
"""Smooth pixel-traced motif polylines into cubic beziers and regenerate motifs.ts.

Usage:
  python3 scripts/smooth-motifs.py

Reads public/motifs/*.svg (M/L/Z polylines), writes smoothed SVGs + src/lib/motifs.ts.
"""
from __future__ import annotations

import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOTIF_DIR = ROOT / "public" / "motifs"
OUT_TS = ROOT / "src" / "lib" / "motifs.ts"
CX = CY = 128.0

MOTIF_ORDER = [
    ("flower", "flower.svg"),
    ("flowerAlt", "flower-alt.svg"),
    ("leaf", "leaf.svg"),
    ("leafAlt", "leaf-alt.svg"),
    ("panda", "panda.svg"),
    ("pandaAlt", "panda-alt.svg"),
    ("elephant", "elephant.svg"),
    ("elephantAlt", "elephant-alt.svg"),
    ("giraffe", "giraffe.svg"),
    ("giraffeAlt", "giraffe-alt.svg"),
    ("fox", "fox.svg"),
    ("foxAlt", "fox-alt.svg"),
    ("rabbit", "rabbit.svg"),
    ("rabbitAlt", "rabbit-alt.svg"),
    ("penguin", "penguin.svg"),
    ("penguinAlt", "penguin-alt.svg"),
    ("bear", "bear.svg"),
    ("bearAlt", "bear-alt.svg"),
]

TOKEN = re.compile(r"[MmLlCcZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?")


def parse_polylines(d: str) -> list[list[tuple[float, float]]]:
    """Flatten M/L/C/Z into rings by sampling cubics."""
    tokens = TOKEN.findall(d)
    rings: list[list[tuple[float, float]]] = []
    cur: list[tuple[float, float]] = []
    i = 0
    cmd = ""
    cx = cy = 0.0

    def add(x: float, y: float) -> None:
        nonlocal cx, cy
        if not cur or math.hypot(x - cx, y - cy) > 1e-6:
            cur.append((x, y))
        cx, cy = x, y

    while i < len(tokens):
        t = tokens[i]
        if re.fullmatch(r"[MmLlCcZz]", t):
            cmd = t
            i += 1
            if cmd in "Zz":
                if len(cur) >= 3:
                    rings.append(cur)
                cur = []
            continue
        if cmd in "ML":
            x, y = float(t), float(tokens[i + 1])
            i += 2
            if cmd == "M":
                if len(cur) >= 3:
                    rings.append(cur)
                cur = []
                add(x, y)
                cmd = "L"
            else:
                add(x, y)
        elif cmd == "C":
            x1, y1 = float(t), float(tokens[i + 1])
            x2, y2 = float(tokens[i + 2]), float(tokens[i + 3])
            x, y = float(tokens[i + 4]), float(tokens[i + 5])
            i += 6
            x0, y0 = cx, cy
            for s in range(1, 9):
                t = s / 8
                u = 1 - t
                px = u**3 * x0 + 3 * u**2 * t * x1 + 3 * u * t**2 * x2 + t**3 * x
                py = u**3 * y0 + 3 * u**2 * t * y1 + 3 * u * t**2 * y2 + t**3 * y
                add(px, py)
        else:
            i += 1
    if len(cur) >= 3:
        rings.append(cur)
    return rings


def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def perp_dist(p, a, b):
    ax, ay = a
    bx, by = b
    px, py = p
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return dist(p, a)
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def rdp(points: list[tuple[float, float]], eps: float) -> list[tuple[float, float]]:
    pts = points[:]
    if len(pts) >= 2 and dist(pts[0], pts[-1]) < 1e-6:
        pts = pts[:-1]
    if len(pts) < 3:
        return pts

    def _rdp(seg):
        if len(seg) < 3:
            return seg
        a, b = seg[0], seg[-1]
        idx, dmax = -1, 0.0
        for i in range(1, len(seg) - 1):
            d = perp_dist(seg[i], a, b)
            if d > dmax:
                idx, dmax = i, d
        if dmax > eps:
            return _rdp(seg[: idx + 1])[:-1] + _rdp(seg[idx:])
        return [a, b]

    simplified = _rdp(pts + [pts[0]])
    if dist(simplified[0], simplified[-1]) < 1e-6:
        simplified = simplified[:-1]
    return simplified if len(simplified) >= 3 else pts


def turn_angle(prev, cur, nxt):
    v1 = (cur[0] - prev[0], cur[1] - prev[1])
    v2 = (nxt[0] - cur[0], nxt[1] - cur[1])
    n1 = math.hypot(*v1)
    n2 = math.hypot(*v2)
    if n1 < 1e-9 or n2 < 1e-9:
        return 0.0
    dot = max(-1.0, min(1.0, (v1[0] * v2[0] + v1[1] * v2[1]) / (n1 * n2)))
    return math.degrees(math.acos(dot))


def collapse_staircases(pts: list[tuple[float, float]], step_tol: float = 5.0):
    if len(pts) < 4:
        return pts[:]
    n = len(pts)
    keep = [True] * n

    def is_h(a, b):
        return abs(a[1] - b[1]) <= 0.6 and abs(a[0] - b[0]) > 0.6

    def is_v(a, b):
        return abs(a[0] - b[0]) <= 0.6 and abs(a[1] - b[1]) > 0.6

    i = 0
    while i < n:
        a, b = pts[i], pts[(i + 1) % n]
        if is_h(a, b):
            expected = "v"
        elif is_v(a, b):
            expected = "h"
        else:
            i += 1
            continue
        j = i + 1
        while j < i + n:
            a, b = pts[j % n], pts[(j + 1) % n]
            if expected == "h" and is_h(a, b) and abs(a[0] - b[0]) <= step_tol * 3:
                expected = "v"
                j += 1
            elif expected == "v" and is_v(a, b) and abs(a[1] - b[1]) <= step_tol * 3:
                expected = "h"
                j += 1
            else:
                break
        if j - i >= 3:
            for k in range(i + 1, j):
                keep[k % n] = False
            i = j
        else:
            i += 1
    out = [p for p, k in zip(pts, keep) if k]
    return out if len(out) >= 3 else pts


def catmull_rom_to_beziers(pts, sharp_deg=48.0, alpha=0.72):
    n = len(pts)
    if n < 3:
        return []
    sharp = [False] * n
    for i in range(n):
        sharp[i] = turn_angle(pts[(i - 1) % n], pts[i], pts[(i + 1) % n]) >= sharp_deg

    cmds = [("M", pts[0][0], pts[0][1])]
    for i in range(n):
        p0 = pts[(i - 1) % n]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n]
        if sharp[i] or sharp[(i + 1) % n]:
            cmds.append(("L", p2[0], p2[1]))
            continue
        c1x = p1[0] + (p2[0] - p0[0]) / 6.0 * alpha * 2
        c1y = p1[1] + (p2[1] - p0[1]) / 6.0 * alpha * 2
        c2x = p2[0] - (p3[0] - p1[0]) / 6.0 * alpha * 2
        c2y = p2[1] - (p3[1] - p1[1]) / 6.0 * alpha * 2
        max_ctrl = dist(p1, p2) * 0.65
        if max_ctrl > 0 and dist(p1, (c1x, c1y)) > max_ctrl:
            dx, dy = c1x - p1[0], c1y - p1[1]
            s = max_ctrl / math.hypot(dx, dy)
            c1x, c1y = p1[0] + dx * s, p1[1] + dy * s
        if max_ctrl > 0 and dist(p2, (c2x, c2y)) > max_ctrl:
            dx, dy = c2x - p2[0], c2y - p2[1]
            s = max_ctrl / math.hypot(dx, dy)
            c2x, c2y = p2[0] + dx * s, p2[1] + dy * s
        cmds.append(("C", c1x, c1y, c2x, c2y, p2[0], p2[1]))
    cmds.append(("Z",))
    return cmds


def fmt(n: float) -> str:
    v = round(n, 2)
    if abs(v - round(v)) < 1e-9:
        return str(int(round(v)))
    return f"{v:.2f}".rstrip("0").rstrip(".")


def cmds_to_d(cmds, ox=0.0, oy=0.0) -> str:
    parts = []
    for c in cmds:
        if c[0] == "M":
            parts.append(f"M {fmt(c[1] - ox)} {fmt(c[2] - oy)}")
        elif c[0] == "L":
            parts.append(f"L {fmt(c[1] - ox)} {fmt(c[2] - oy)}")
        elif c[0] == "C":
            parts.append(
                f"C {fmt(c[1] - ox)} {fmt(c[2] - oy)} {fmt(c[3] - ox)} {fmt(c[4] - oy)} {fmt(c[5] - ox)} {fmt(c[6] - oy)}"
            )
        elif c[0] == "Z":
            parts.append("Z")
    return "".join(parts)


def smooth_path_d(d: str, *, centered: bool) -> str:
    rings = parse_polylines(d)
    out = []
    for ring in rings:
        pts = ring[:]
        if len(pts) >= 2 and dist(pts[0], pts[-1]) < 1e-6:
            pts = pts[:-1]
        # Only collapse stairs on polylines (no existing cubics sampled densely)
        if "C" not in d and "c" not in d:
            pts = collapse_staircases(pts, step_tol=5.0)
            pts = rdp(pts, eps=1.35)
        if len(pts) < 3:
            continue
        out.extend(catmull_rom_to_beziers(pts))
    if centered:
        return cmds_to_d(out, CX, CY)
    return cmds_to_d(out, 0, 0)


def extract_paths(svg_text: str) -> list[str]:
    return re.findall(r'<path[^>]*\sd="([^"]+)"', svg_text)


def write_svg(path: Path, title: str, path_ds: list[str]) -> None:
    groups = "\n  ".join(
        f'<g fill="currentColor" fill-rule="evenodd"><path d="{d}"/></g>' for d in path_ds
    )
    path.write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">\n'
        f"  <title>{title}</title>\n"
        f"  {groups}\n"
        f"</svg>\n"
    )


def main() -> None:
    centered: dict[str, list[str]] = {}
    for mid, fname in MOTIF_ORDER:
        p = MOTIF_DIR / fname
        text = p.read_text()
        raw_paths = extract_paths(text)
        # If already cubic-smoothed, leave SVG as-is and only recenter for TS
        if any("C" in d for d in raw_paths):
            svg_ds = raw_paths
            centered_ds = [smooth_path_d(d, centered=True) for d in raw_paths]
            # smooth_path_d on cubics re-fits; for already-smooth use translate only
            centered_ds = []
            for d in raw_paths:
                # translate absolute coords by -128
                tokens = TOKEN.findall(d)
                out = []
                i = 0
                cmd = ""
                while i < len(tokens):
                    t = tokens[i]
                    if re.fullmatch(r"[MmLlCcZz]", t):
                        cmd = t
                        out.append(t)
                        i += 1
                        continue
                    if cmd in "ML":
                        x, y = float(t) - CX, float(tokens[i + 1]) - CY
                        out.append(f" {fmt(x)} {fmt(y)}")
                        i += 2
                        if cmd == "M":
                            cmd = "L"
                    elif cmd == "C":
                        nums = [float(tokens[i + k]) for k in range(6)]
                        i += 6
                        parts = []
                        for k in range(0, 6, 2):
                            parts.append(f"{fmt(nums[k] - CX)} {fmt(nums[k + 1] - CY)}")
                        out.append(" " + " ".join(parts))
                    else:
                        i += 1
                d_out = "".join(out)
                d_out = re.sub(r"(\d)([MLCZ])", r"\1 \2", d_out)
                d_out = re.sub(r"([MLCZ])\s*", r"\1 ", d_out)
                d_out = re.sub(r"\s+", " ", d_out).strip()
                d_out = re.sub(r"\s+Z$", "Z", d_out)
                centered_ds.append(d_out)
        else:
            svg_ds = [smooth_path_d(d, centered=False) for d in raw_paths]
            centered_ds = [smooth_path_d(d, centered=True) for d in raw_paths]
            title_m = re.search(r"<title>([^<]+)</title>", text)
            title = title_m.group(1) if title_m else fname
            write_svg(p, title, svg_ds)
        centered[mid] = centered_ds
        print(f"{fname}: {len(centered_ds)} path(s)")

    lines = [
        'import type { MotifId } from "./types";',
        'import type { DrawOp } from "./unitPlan";',
        "",
        "/**",
        " * Cover motifs from the Foldmark logo set in public/motifs/.",
        " * Smoothed cubic paths (from pixel-traced logos) in a 256×256 box",
        " * centered at (0,0); `scale` ≈ half-width in points.",
        " */",
        "",
        "const MOTIF_PATHS: Partial<Record<MotifId, string[]>> = {",
    ]
    for mid, _ in MOTIF_ORDER:
        lines.append(f"  {mid}: [")
        for d in centered[mid]:
            lines.append(f"    `{d}`,")
        lines.append("  ],")
    lines += [
        "};",
        "",
        "const LOCAL_HALF = 128;",
        "",
        "export function buildCoverMotif(id: MotifId, cx: number, cy: number, scale: number): DrawOp[] {",
        "  const ds = MOTIF_PATHS[id];",
        '  if (!ds || id === "none") return [];',
        "  const s = Math.max(0.12, scale / LOCAL_HALF);",
        "  return ds.map((d) => ({",
        '    kind: "path" as const,',
        "    d,",
        "    x: cx,",
        "    y: cy,",
        "    scale: s,",
        '    fill: "accent" as const,',
        '    fillRule: "evenodd" as const,',
        "    opacity: 1,",
        "  }));",
        "}",
        "",
        "export function motifHeightFactor(id: MotifId): number {",
        '  if (id === "none") return 0;',
        "  return 2.05;",
        "}",
        "",
    ]
    OUT_TS.write_text("\n".join(lines))
    print(f"Wrote {OUT_TS}")


if __name__ == "__main__":
    main()
