import type { DesignState, FontId, MotifId, PatternId } from "@/lib/types";
import { buildPatternOps, buildUnitPlan, type DrawOp } from "@/lib/unitPlan";
import { buildCoverMotif } from "@/lib/motifs";
import { resolveColors, type ResolvedColors } from "@/lib/colors";
import { computeSheet } from "@/lib/sheet";
import { cssFontStack } from "@/lib/bookmarkFont";

type PreviewDesign = Pick<
  DesignState,
  | "shape"
  | "title"
  | "subtitle"
  | "paletteId"
  | "pattern"
  | "motif"
  | "paperSize"
  | "printMode"
  | "bgImage"
  | "surfaceMode"
  | "fontId"
  | "fontSize"
  | "accordionPanels"
  | "accordionDirection"
>;

/**
 * Renders the shared DrawOp list (see lib/unitPlan.ts) as SVG. This function
 * — not a second hand-written drawing routine — is what both the single-unit
 * preview and the full-sheet preview use, and it's the same op list the PDF
 * renderer consumes. One layout, three views, guaranteed to agree.
 */
function renderOps(ops: DrawOp[], colors: ResolvedColors, keyPrefix: string, fontFamily: string) {
  return ops.map((op, i) => {
    const key = `${keyPrefix}-${i}`;
    if (op.kind === "rect") {
      return (
        <rect
          key={key}
          x={op.x}
          y={op.y}
          width={op.w}
          height={op.h}
          fill={op.fill ? colors[op.fill] : "none"}
          fillOpacity={op.opacity}
          stroke={op.stroke && op.stroke !== "none" ? colors[op.stroke] : "none"}
          strokeWidth={1}
        />
      );
    }
    if (op.kind === "line") {
      return (
        <line
          key={key}
          x1={op.x1}
          y1={op.y1}
          x2={op.x2}
          y2={op.y2}
          stroke={colors[op.stroke]}
          strokeOpacity={op.opacity}
          strokeWidth={op.weight ?? 1}
          strokeDasharray={op.dashed ? "4 3" : undefined}
        />
      );
    }
    if (op.kind === "circle") {
      return (
        <circle
          key={key}
          cx={op.cx}
          cy={op.cy}
          r={op.r}
          fill={op.fill && op.fill !== "none" ? colors[op.fill] : "none"}
          fillOpacity={op.opacity}
          stroke={op.stroke ? colors[op.stroke] : "none"}
          strokeWidth={1}
        />
      );
    }
    if (op.kind === "path") {
      const scale = op.scale ?? 1;
      const fillKey = op.fill && op.fill !== "none" ? op.fill : null;
      const strokeKey = op.stroke ?? null;
      return (
        <path
          key={key}
          d={op.d}
          transform={`translate(${op.x} ${op.y}) scale(${scale})`}
          fill={fillKey ? colors[fillKey] : "none"}
          fillOpacity={fillKey ? op.opacity : undefined}
          stroke={strokeKey ? colors[strokeKey] : "none"}
          strokeOpacity={strokeKey ? op.opacity : undefined}
          strokeWidth={op.weight ?? 1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }
    if (op.kind === "image") {
      const clipId = `${keyPrefix}-clip-${i}`;
      return (
        <g key={key}>
          <defs>
            <clipPath id={clipId}>
              <rect x={op.x} y={op.y} width={op.w} height={op.h} />
            </clipPath>
          </defs>
          <image
            href={op.href}
            x={op.x}
            y={op.y}
            width={op.w}
            height={op.h}
            opacity={op.opacity ?? 1}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
          />
        </g>
      );
    }
    return (
      <text
        key={key}
        x={op.x}
        y={op.y}
        fontSize={op.size}
        fontWeight={op.bold ? 600 : 400}
        fontStyle={op.italic ? "italic" : "normal"}
        fill={colors[op.color]}
        fontFamily={fontFamily}
        textAnchor={op.align === "center" ? "middle" : op.align === "right" ? "end" : "start"}
      >
        {op.text}
      </text>
    );
  });
}

function surfaceImage(design: PreviewDesign) {
  return design.surfaceMode === "image" ? design.bgImage : null;
}

/** A small live tile of a pattern, rendered with the exact same ops the
 * bookmark itself uses — so the picker never lies about what you'll get. */
export function PatternSwatch({
  pattern,
  colors,
  fontId = "cormorant",
}: {
  pattern: PatternId;
  colors: ResolvedColors;
  fontId?: FontId;
}) {
  const w = 72;
  const h = 44;
  const ops = buildPatternOps(pattern, w, h);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="pattern-swatch-svg" role="img" aria-hidden="true">
      <rect x={0} y={0} width={w} height={h} fill={colors.paper} />
      {renderOps(ops, colors, `pat-${pattern}`, cssFontStack(fontId))}
    </svg>
  );
}

/** Live tile of a cover motif — same paths as the bookmark face. */
export function MotifSwatch({
  motif,
  colors,
  fontId = "cormorant",
}: {
  motif: MotifId;
  colors: ResolvedColors;
  fontId?: FontId;
}) {
  const w = 72;
  const h = 64;
  const ops = buildCoverMotif(motif, w / 2, h * 0.55, 28);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="pattern-swatch-svg motif-swatch-svg" role="img" aria-hidden="true">
      <rect x={0} y={0} width={w} height={h} fill={colors.paper} />
      {motif === "none" ? (
        <line
          x1={18}
          y1={h / 2}
          x2={w - 18}
          y2={h / 2}
          stroke={colors.secondary}
          strokeWidth={1}
          strokeOpacity={0.55}
        />
      ) : (
        renderOps(ops, colors, `motif-${motif}`, cssFontStack(fontId))
      )}
    </svg>
  );
}

/** A single bookmark unit, at true physical proportions. */
export function UnitPreview({ design }: { design: PreviewDesign }) {
  const plan = buildUnitPlan(
    design.shape,
    design.title,
    design.subtitle,
    design.pattern,
    design.paperSize,
    surfaceImage(design),
    design.fontSize,
    design.motif,
    design.accordionPanels,
    design.accordionDirection,
  );
  const colors = resolveColors(design.paletteId, design.printMode);
  const fontFamily = cssFontStack(design.fontId);
  return (
    <svg
      viewBox={`0 0 ${plan.size.w} ${plan.size.h}`}
      className="unit-svg"
      data-shape={design.shape}
      role="img"
      aria-label="Bookmark preview"
    >
      {renderOps(plan.ops, colors, "unit", fontFamily)}
    </svg>
  );
}

/** A miniature of the whole printed page — the exact same grid math
 * (lib/sheet.ts) that the PDF export uses, so this is a true preview of
 * what will come out of the printer, not an approximation. */
export function SheetPreview({ design }: { design: PreviewDesign }) {
  const sheet = computeSheet(design.paperSize, design.shape);
  const plan = buildUnitPlan(
    design.shape,
    design.title,
    design.subtitle,
    design.pattern,
    design.paperSize,
    surfaceImage(design),
    design.fontSize,
    design.motif,
    design.accordionPanels,
    design.accordionDirection,
  );
  const colors = resolveColors(design.paletteId, design.printMode);
  const fontFamily = cssFontStack(design.fontId);
  return (
    <svg
      viewBox={`0 0 ${sheet.page.w} ${sheet.page.h}`}
      className="sheet-svg"
      role="img"
      aria-label="Full sheet preview"
    >
      <rect x={0} y={0} width={sheet.page.w} height={sheet.page.h} fill="#ffffff" stroke="#c5cac0" />
      {sheet.positions.map((pos, i) => (
        <g key={i} transform={`translate(${pos.x} ${pos.y})`}>
          {renderOps(plan.ops, colors, `s${i}`, fontFamily)}
        </g>
      ))}
    </svg>
  );
}
