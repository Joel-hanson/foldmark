"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { PALETTES, MOTIFS, PATTERNS, PAPER_LABELS, PHRASE_PRESETS, SHAPES, getShapeInfo } from "@/lib/catalog";
import { defaultDesign, designFromQuery, designToQuery } from "@/lib/designState";
import type { DesignState, FontId, FontSizeId, MotifId, PaperSize, PatternId } from "@/lib/types";
import { MotifSwatch, PatternSwatch, SheetPreview, UnitPreview } from "@/components/BookmarkArt";
import { resolveColors } from "@/lib/colors";
import { computeSheet } from "@/lib/sheet";
import { buildUnitPlan } from "@/lib/unitPlan";
import { buildBookmarkPdf, downloadPdfBytes } from "@/lib/pdf";
import { BOOKMARK_FONTS, FONT_SIZES, cssFontStack } from "@/lib/bookmarkFont";

const IMAGE_STORAGE_KEY = "foldmark-bg-image";
const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

function readFileAsDataUrl(file: File): Promise<string> {
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

export function MakerApp() {
  const searchParams = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const [design, setDesign] = useState<DesignState>(() => {
    const fromUrl = designFromQuery(searchParams.toString()) ?? defaultDesign();
    return fromUrl;
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Restore an uploaded image from this tab (too large for the share URL).
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
    ],
  );

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

  async function handleImagePick(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError("Use a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Keep the image under 2.5 MB so the PDF stays printable.");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      // WebP preview works in SVG; PDF export needs PNG/JPEG — convert via canvas if needed.
      let printable = dataUrl;
      if (file.type === "image/webp") {
        printable = await webpToJpegDataUrl(dataUrl);
      }
      setDesign((d) => ({ ...d, surfaceMode: "image", bgImage: printable }));
    } catch {
      setError("Could not read that image.");
    }
  }

  return (
    <div className="maker shell">
      <div className="maker-top">
        <div>
          <h1 className="maker-title">Make a bookmark</h1>
          <p className="maker-lead">
            Pick a shape, dress the face with a pattern or your own image, print,
            and fold the numbered lines — no scissors needed.
          </p>
        </div>
        <div className="maker-cta-row">
          <button type="button" className="btn btn-secondary" onClick={handleShare}>
            {copied ? "Link copied" : "Copy link"}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleDownload} disabled={pending}>
            {pending ? "Building PDF…" : "Download PDF"}
          </button>
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

          <h2 className="panel-kicker" style={{ marginTop: "1.5rem" }}>
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
            <div className="upload-block">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => {
                  void handleImagePick(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {design.bgImage ? (
                <div className="upload-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={design.bgImage} alt="Uploaded face" />
                </div>
              ) : (
                <p className="hint" style={{ marginTop: 0 }}>
                  A photo, scan, or seamless pattern — cropped to fill the bookmark face.
                </p>
              )}
              <div className="maker-cta-row" style={{ marginTop: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
                  {design.bgImage ? "Replace image" : "Upload image"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    void (async () => {
                      try {
                        setError(null);
                        const res = await fetch("/patterns/swirls-sample.png");
                        if (!res.ok) throw new Error("missing");
                        const blob = await res.blob();
                        const file = new File([blob], "swirls-sample.png", { type: "image/png" });
                        await handleImagePick(file);
                      } catch {
                        setError("Could not load the sample texture.");
                      }
                    })();
                  }}
                >
                  Try sample swirls
                </button>
                {design.bgImage ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setDesign((d) => ({ ...d, bgImage: null, surfaceMode: "pattern" }))}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          )}

          <h2 className="panel-kicker" style={{ marginTop: "1.5rem" }}>
            Motif
          </h2>
          <p className="hint" style={{ marginTop: "-0.35rem", marginBottom: "0.65rem" }}>
            Wildlife face icons — simple line drawings.
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
              onChange={(e) => setDesign((d) => ({ ...d, paperSize: e.target.value as PaperSize }))}
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
              ? `No cutting — fan-fold lines 1–${plan.foldCount - 1}, then fold ${plan.foldCount} to finish.`
              : shapeInfo.howTo}
          </p>

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

function webpToJpegDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No canvas"));
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => reject(new Error("Could not decode WebP"));
    img.src = dataUrl;
  });
}
