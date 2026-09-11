"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  PALETTES,
  MOTIFS,
  PATTERNS,
  PAPER_LABELS,
  PHRASE_PRESETS,
  LOOK_PRESETS,
  SHAPES,
  ACCORDION_PANEL_OPTIONS,
  ACCORDION_DIRECTION_OPTIONS,
  getShapeInfo,
  getPalette,
} from "@/lib/catalog";
import { defaultDesign, designFromQuery, designToQuery } from "@/lib/designState";
import type { AccordionDirection, AccordionPanels, DesignState, FontId, FontSizeId, MotifId, PaperSize, PatternId } from "@/lib/types";
import { MotifSwatch, PatternSwatch, SheetPreview, UnitPreview } from "@/components/BookmarkArt";
import { FoldGuide } from "@/components/FoldGuide";
import { ImageFaceEditor } from "@/components/ImageFaceEditor";
import { resolveColors } from "@/lib/colors";
import { computeSheet } from "@/lib/sheet";
import { buildUnitPlan, suggestedAccordionPanels } from "@/lib/unitPlan";
import { buildBookmarkPdf, downloadPdfBytes } from "@/lib/pdf";
import { BOOKMARK_FONTS, FONT_SIZES, cssFontStack } from "@/lib/bookmarkFont";

const IMAGE_STORAGE_KEY = "foldmark-bg-image";

export function MakerApp() {
  const searchParams = useSearchParams();
  const [design, setDesign] = useState<DesignState>(() => {
    return designFromQuery(searchParams.toString()) ?? defaultDesign();
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(IMAGE_STORAGE_KEY);
      if (stored) {
        setDesign((d) => ({
          ...d,
          bgImage: stored,
          surfaceMode: d.surfaceMode === "image" || searchParams.get("surface") === "image" ? "image" : d.surfaceMode,
        }));
      }
    } catch {
      /* private mode / blocked storage — ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once on mount
  }, []);

  useEffect(() => {
    const next = `/?${designToQuery(design)}`;
    if (`${window.location.pathname}${window.location.search}` !== next) {
      window.history.replaceState(null, "", next);
    }
  }, [design]);

  useEffect(() => {
    try {
      if (design.bgImage) sessionStorage.setItem(IMAGE_STORAGE_KEY, design.bgImage);
      else sessionStorage.removeItem(IMAGE_STORAGE_KEY);
    } catch {
      /* ignore quota / private mode */
    }
  }, [design.bgImage]);

  const shapeInfo = getShapeInfo(design.shape);
  const colors = useMemo(
    () => resolveColors(design.paletteId, design.printMode),
    [design.paletteId, design.printMode],
  );
  const sheet = useMemo(
    () => computeSheet(design.paperSize, design.shape),
    [design.paperSize, design.shape],
  );
  const plan = useMemo(
    () =>
      buildUnitPlan(
        design.shape,
        design.title,
        design.subtitle,
        design.pattern,
        design.paperSize,
        design.surfaceMode === "image" ? design.bgImage : null,
        design.fontSize,
        design.motif,
        design.accordionPanels,
        design.accordionDirection,
      ),
    [
      design.shape,
      design.title,
      design.subtitle,
      design.pattern,
      design.paperSize,
      design.surfaceMode,
      design.bgImage,
      design.fontSize,
      design.motif,
      design.accordionPanels,
      design.accordionDirection,
    ],
  );

  const lead =
    design.shape === "accordion"
      ? "Pick a look, type a line, download a PDF — fan-fold the numbered lines, no scissors."
      : "Pick a look, type a line, download a PDF — cut the square, fold twice into a pocket.";

  function handleDownload() {
    setError(null);
    if (design.surfaceMode === "image" && !design.bgImage) {
      setError("Upload an image first, or switch back to a pattern.");
      return;
    }
    const snapshot = design;
    startTransition(async () => {
      try {
        const bytes = await buildBookmarkPdf(snapshot);
        downloadPdfBytes(bytes, `foldmark-${snapshot.shape}.pdf`);
      } catch {
        setError("Could not build the PDF. Try a PNG or JPEG under 2.5 MB.");
      }
    });
  }

  async function handleShare() {
    const url = `${window.location.origin}/?${designToQuery(design)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy the link.");
    }
  }

  function applyLook(id: string) {
    const look = LOOK_PRESETS.find((l) => l.id === id);
    if (!look) return;
    setDesign((d) => ({
      ...d,
      title: look.title,
      subtitle: look.subtitle,
      paletteId: look.paletteId,
      pattern: look.pattern,
      motif: look.motif,
      surfaceMode: "pattern",
    }));
  }

  const activeLookId =
    LOOK_PRESETS.find(
      (l) =>
        l.title === design.title &&
        l.subtitle === design.subtitle &&
        l.paletteId === design.paletteId &&
        l.pattern === design.pattern &&
        l.motif === design.motif &&
        design.surfaceMode === "pattern",
    )?.id ?? null;

  return (
    <div className="maker shell">
      <div className="maker-top">
        <div>
          <h1 className="maker-title">Make a bookmark</h1>
          <p className="maker-lead">{lead}</p>
        </div>
        <div className="maker-cta-col">
          <div className="maker-cta-row">
            <button type="button" className="btn btn-secondary" onClick={handleShare}>
              {copied ? "Link copied" : "Copy link"}
            </button>
            <button type="button" className="btn btn-primary" onClick={handleDownload} disabled={pending}>
              {pending ? "Building PDF…" : "Download PDF"}
            </button>
          </div>
          <p className="print-tip">Print at <strong>100% / Actual size</strong> — turn off “fit to page.”</p>
        </div>
      </div>

      <div className="maker-layout">
        <section className="panel" aria-label="Bookmark options">
          <h2 className="panel-kicker">Shape</h2>
          <div className="shape-row">
            {SHAPES.map((s) => (
              <button
                key={s.id}
                type="button"
                className="shape-card"
                data-active={design.shape === s.id}
                onClick={() => setDesign((d) => ({ ...d, shape: s.id }))}
              >
                <strong>{s.name}</strong>
                <span>{s.howTo}</span>
              </button>
            ))}
          </div>

          <h2 className="panel-kicker" style={{ marginTop: "1.5rem" }}>
            Look
          </h2>
          <div className="look-row" role="list">
            {LOOK_PRESETS.map((look) => {
              const pal = getPalette(look.paletteId);
              return (
                <button
                  key={look.id}
                  type="button"
                  className="look-chip"
                  data-active={activeLookId === look.id}
                  role="listitem"
                  onClick={() => applyLook(look.id)}
                >
                  <span className="look-swatch" aria-hidden="true">
                    <i style={{ background: pal.paper }} />
                    <i style={{ background: pal.accent }} />
                  </span>
                  <span className="look-name">{look.name}</span>
                </button>
              );
            })}
          </div>

          <h2 className="panel-kicker" style={{ marginTop: "1.25rem" }}>
            Words
          </h2>
          <div className="phrase-row" role="list">
            {PHRASE_PRESETS.map((phrase) => {
              const active = design.title === phrase.title && design.subtitle === phrase.subtitle;
              return (
                <button
                  key={`${phrase.title}-${phrase.subtitle}`}
                  type="button"
                  className="phrase-chip"
                  data-active={active}
                  role="listitem"
                  onClick={() => setDesign((d) => ({ ...d, title: phrase.title, subtitle: phrase.subtitle }))}
                >
                  {phrase.title}
                </button>
              );
            })}
          </div>
          <div className="field">
            <label htmlFor="title">Your line</label>
            <input
              id="title"
              value={design.title}
              maxLength={48}
              placeholder="keep going"
              onChange={(e) => setDesign((d) => ({ ...d, title: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="subtitle">Quieter line (optional)</label>
            <input
              id="subtitle"
              value={design.subtitle}
              maxLength={60}
              placeholder="leave blank for a flourish"
              onChange={(e) => setDesign((d) => ({ ...d, subtitle: e.target.value }))}
            />
          </div>

          <button
            type="button"
            className="customize-toggle"
            aria-expanded={customizeOpen}
            onClick={() => setCustomizeOpen((o) => !o)}
          >
            {customizeOpen ? "Hide customize" : "Customize type, color, face…"}
          </button>

          {customizeOpen ? (
            <div className="customize-block">
              {design.shape === "accordion" ? (
                <>
                  <h2 className="panel-kicker">Folds</h2>
                  <p className="hint" style={{ marginTop: "-0.35rem", marginBottom: "0.65rem" }}>
                    Fold down prints a landscape cover — fan-fold and you&apos;re done.
                  </p>
                  <div className="size-row" role="list" aria-label="Fold direction">
                    {ACCORDION_DIRECTION_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className="size-chip"
                        data-active={design.accordionDirection === opt.id}
                        role="listitem"
                        title={opt.blurb}
                        onClick={() =>
                          setDesign((d) => ({
                            ...d,
                            accordionDirection: opt.id as AccordionDirection,
                            accordionPanels: suggestedAccordionPanels(d.paperSize, opt.id),
                          }))
                        }
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                  <div className="size-row" role="list" aria-label="Accordion fold count" style={{ marginTop: "-0.5rem" }}>
                    {ACCORDION_PANEL_OPTIONS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        className="size-chip"
                        data-active={design.accordionPanels === n}
                        role="listitem"
                        onClick={() => setDesign((d) => ({ ...d, accordionPanels: n as AccordionPanels }))}
                      >
                        {n} panels
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              <h2 className="panel-kicker" style={{ marginTop: design.shape === "accordion" ? 0 : undefined }}>
                Type
              </h2>
              <div className="font-row" role="list">
                {BOOKMARK_FONTS.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    className="font-card"
                    data-active={design.fontId === font.id}
                    role="listitem"
                    style={{ fontFamily: cssFontStack(font.id) }}
                    onClick={() => setDesign((d) => ({ ...d, fontId: font.id as FontId }))}
                  >
                    <span className="font-card-sample">Aa</span>
                    <span className="font-card-name">{font.name}</span>
                  </button>
                ))}
              </div>
              <div className="size-row" role="list" aria-label="Font size">
                {FONT_SIZES.map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    className="size-chip"
                    data-active={design.fontSize === size.id}
                    role="listitem"
                    onClick={() => setDesign((d) => ({ ...d, fontSize: size.id as FontSizeId }))}
                  >
                    {size.name}
                  </button>
                ))}
              </div>

              <h2 className="panel-kicker" style={{ marginTop: "1.5rem" }}>
                Color
              </h2>
              <div className="swatches">
                {PALETTES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="swatch"
                    title={p.name}
                    aria-label={p.name}
                    data-active={design.paletteId === p.id}
                    onClick={() => setDesign((d) => ({ ...d, paletteId: p.id }))}
                  >
                    <span style={{ background: p.paper }} />
                    <span style={{ background: p.accent }} />
                  </button>
                ))}
              </div>

              <h2 className="panel-kicker" style={{ marginTop: "1.5rem" }}>
                Face
              </h2>
              <div className="surface-tabs" role="tablist" aria-label="Face fill">
                <button
                  type="button"
                  role="tab"
                  aria-selected={design.surfaceMode === "pattern"}
                  data-active={design.surfaceMode === "pattern"}
                  onClick={() => setDesign((d) => ({ ...d, surfaceMode: "pattern" }))}
                >
                  Pattern
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={design.surfaceMode === "image"}
                  data-active={design.surfaceMode === "image"}
                  onClick={() => setDesign((d) => ({ ...d, surfaceMode: "image" }))}
                >
                  Your image
                </button>
              </div>

              {design.surfaceMode === "pattern" ? (
                <div className="pattern-row">
                  {PATTERNS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="pattern-card"
                      data-active={design.pattern === p.id}
                      onClick={() => setDesign((d) => ({ ...d, pattern: p.id as PatternId, surfaceMode: "pattern" }))}
                    >
                      <PatternSwatch pattern={p.id} colors={colors} />
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <ImageFaceEditor
                  shape={design.shape}
                  bgImage={design.bgImage}
                  onError={setError}
                  onChange={(bgImage) =>
                    setDesign((d) => ({
                      ...d,
                      bgImage,
                      surfaceMode: bgImage ? "image" : "pattern",
                    }))
                  }
                />
              )}

              <h2 className="panel-kicker" style={{ marginTop: "1.5rem" }}>
                Motif
              </h2>
              <p className="hint" style={{ marginTop: "-0.35rem", marginBottom: "0.65rem" }}>
                Small cover ornament under the title.
              </p>
              <div className="pattern-row">
                {MOTIFS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="pattern-card"
                    data-active={design.motif === m.id}
                    onClick={() => setDesign((d) => ({ ...d, motif: m.id as MotifId }))}
                  >
                    <MotifSwatch motif={m.id} colors={colors} />
                    <span>{m.name}</span>
                  </button>
                ))}
              </div>

              <h2 className="panel-kicker" style={{ marginTop: "1.5rem" }}>
                Print setup
              </h2>
              <div className="field">
                <label htmlFor="paper">Paper size</label>
                <select
                  id="paper"
                  value={design.paperSize}
                  onChange={(e) =>
                    setDesign((d) => {
                      const paperSize = e.target.value as PaperSize;
                      return {
                        ...d,
                        paperSize,
                        accordionPanels: suggestedAccordionPanels(paperSize, d.accordionDirection),
                      };
                    })
                  }
                >
                  {Object.entries(PAPER_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="toggle-row">
                <span>Color print</span>
                <button
                  type="button"
                  className="toggle"
                  data-on={design.printMode === "color"}
                  aria-pressed={design.printMode === "color"}
                  onClick={() =>
                    setDesign((d) => ({ ...d, printMode: d.printMode === "color" ? "bw" : "color" }))
                  }
                >
                  <i />
                </button>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="hint" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          ) : null}
        </section>

        <aside className="preview-pane">
          <div className="preview-card" data-shape={design.shape}>
            <UnitPreview design={design} />
          </div>
          <p className="hint" style={{ textAlign: "center" }}>
            {design.shape === "accordion"
              ? design.accordionDirection === "vertical"
                ? `No cutting — fan-fold lines 1–${plan.foldCount} down the page, then use. Cover is already landscape.`
                : `No cutting — fan-fold lines 1–${plan.foldCount - 1} across, then fold ${plan.foldCount} to finish.`
              : shapeInfo.howTo}
          </p>

          <FoldGuide
            shape={design.shape}
            accordionDirection={design.accordionDirection}
            foldCount={plan.foldCount}
          />

          <div className="sheet-card">
            <SheetPreview design={design} />
          </div>
          <p className="hint" style={{ textAlign: "center" }}>
            {sheet.count} per {PAPER_LABELS[design.paperSize]} sheet — this is the exact sheet that prints.
          </p>
        </aside>
      </div>
    </div>
  );
}
