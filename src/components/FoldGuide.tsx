"use client";

import type { AccordionDirection, Shape } from "@/lib/types";

type FoldGuideProps = {
  shape: Shape;
  accordionDirection: AccordionDirection;
  foldCount: number;
};

/**
 * Short looping SVG that shows the fold order — the product's trust cue.
 * Respects prefers-reduced-motion (static final frame).
 */
export function FoldGuide({ shape, accordionDirection, foldCount }: FoldGuideProps) {
  if (shape === "corner") {
    return (
      <div className="fold-guide" aria-hidden="true">
        <svg viewBox="0 0 160 100" className="fold-guide-svg">
          <rect className="fg-paper" x="48" y="18" width="64" height="64" />
          <line className="fg-crease" x1="48" y1="18" x2="112" y2="82" />
          <line className="fg-crease" x1="112" y1="18" x2="48" y2="82" />
          <g className="fg-corner-steps">
            <path className="fg-fold-a" d="M 48 18 L 112 18 L 80 50 Z" />
            <path className="fg-fold-b" d="M 112 18 L 112 82 L 80 50 Z" />
            <path className="fg-pocket" d="M 80 50 L 112 82 L 48 82 Z" />
          </g>
          <text className="fg-label" x="80" y="96" textAnchor="middle">
            cut → fold 1 → fold 2 → pocket
          </text>
        </svg>
        <ol className="fold-guide-steps">
          <li>Cut the outer square</li>
          <li>Fold triangle on line 1</li>
          <li>Fold on line 2 into a pocket</li>
        </ol>
      </div>
    );
  }

  const vertical = accordionDirection === "vertical";
  const panels = Math.min(6, Math.max(3, foldCount + (vertical ? 1 : 0)));
  const lines = vertical ? panels - 1 : foldCount;

  return (
    <div className="fold-guide" aria-hidden="true">
      <svg viewBox="0 0 160 100" className="fold-guide-svg">
        <rect className="fg-paper" x="28" y="12" width="104" height="72" />
        {vertical
          ? Array.from({ length: lines }, (_, i) => {
              const y = 12 + ((i + 1) / panels) * 72;
              return (
                <g key={i}>
                  <line className="fg-crease fg-animate-line" x1="32" y1={y} x2="128" y2={y} style={{ animationDelay: `${i * 0.35}s` }} />
                  <text className="fg-num" x="36" y={y - 3}>
                    {i + 1}
                  </text>
                </g>
              );
            })
          : Array.from({ length: Math.max(1, lines - 1) }, (_, i) => {
              const x = 28 + ((i + 1) / panels) * 104;
              return (
                <g key={i}>
                  <line className="fg-crease fg-animate-line" x1={x} y1="16" x2={x} y2="80" style={{ animationDelay: `${i * 0.35}s` }} />
                  <text className="fg-num" x={x + 3} y="26">
                    {i + 1}
                  </text>
                </g>
              );
            })}
        {!vertical ? (
          <line
            className="fg-crease fg-accent fg-animate-line"
            x1="32"
            y1="48"
            x2="128"
            y2="48"
            style={{ animationDelay: `${Math.max(0, lines - 1) * 0.35}s` }}
          />
        ) : null}
        <text className="fg-label" x="80" y="96" textAnchor="middle">
          {vertical ? `fan-fold 1–${lines} · cover ready` : `fan-fold, then fold ${lines}`}
        </text>
      </svg>
      <ol className="fold-guide-steps">
        {vertical ? (
          <>
            <li>Print at 100% / Actual size</li>
            <li>Fan-fold on numbered lines 1–{lines}</li>
            <li>Cover is already landscape — done</li>
          </>
        ) : (
          <>
            <li>Print at 100% / Actual size</li>
            <li>Fan-fold across on lines 1–{Math.max(1, lines - 1)}</li>
            <li>Finish with fold {lines}</li>
          </>
        )}
      </ol>
    </div>
  );
}
