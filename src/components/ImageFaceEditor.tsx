"use client";

import { useEffect, useRef, useState } from "react";
import type { Shape } from "@/lib/types";
import {
  ALLOWED_IMAGE_TYPES,
  DEFAULT_CROP,
  MAX_IMAGE_BYTES,
  compressImageDataUrl,
  cropCoverDataUrl,
  cropOutputSize,
  readFileAsDataUrl,
  type ImageCrop,
} from "@/lib/imagePrep";

const SOURCE_KEY = "foldmark-bg-source";
const CROP_KEY = "foldmark-bg-crop";

type ImageFaceEditorProps = {
  shape: Shape;
  bgImage: string | null;
  onChange: (bgImage: string | null) => void;
  onError: (message: string | null) => void;
};

export function ImageFaceEditor({ shape, bgImage, onChange, onError }: ImageFaceEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ x: number; y: number; crop: ImageCrop } | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState<ImageCrop>(DEFAULT_CROP);
  const [busy, setBusy] = useState(false);

  // Restore source + crop for re-editing in this tab.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SOURCE_KEY);
      const cropRaw = sessionStorage.getItem(CROP_KEY);
      if (stored) setSource(stored);
      if (cropRaw) {
        const parsed = JSON.parse(cropRaw) as ImageCrop;
        if (typeof parsed.zoom === "number") setCrop(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      if (source) sessionStorage.setItem(SOURCE_KEY, source);
      else sessionStorage.removeItem(SOURCE_KEY);
      sessionStorage.setItem(CROP_KEY, JSON.stringify(crop));
    } catch {
      /* ignore */
    }
  }, [source, crop]);

  async function bake(nextSource: string, nextCrop: ImageCrop) {
    setBusy(true);
    onError(null);
    try {
      const size = cropOutputSize(shape);
      const cropped = await cropCoverDataUrl(nextSource, size.w, size.h, nextCrop);
      onChange(cropped);
    } catch {
      onError("Could not crop that image.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePick(file: File | undefined) {
    if (!file) return;
    onError(null);
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      onError("Use a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onError("Keep the image under 2.5 MB so the PDF stays printable.");
      return;
    }
    try {
      setBusy(true);
      const raw = await readFileAsDataUrl(file);
      const compressed = await compressImageDataUrl(raw);
      const nextCrop = DEFAULT_CROP;
      setSource(compressed);
      setCrop(nextCrop);
      await bake(compressed, nextCrop);
    } catch {
      onError("Could not read that image.");
      setBusy(false);
    }
  }

  function updateCrop(partial: Partial<ImageCrop>) {
    if (!source) return;
    const next = { ...crop, ...partial };
    setCrop(next);
    void bake(source, next);
  }

  // Re-bake when shape changes (different cover aspect).
  useEffect(() => {
    if (!source) return;
    void bake(source, crop);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when shape flips
  }, [shape]);

  return (
    <div className="upload-block">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => {
          void handlePick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {source || bgImage ? (
        <div className="image-cropper">
          <div
            className="image-cropper-stage"
            data-shape={shape}
            onPointerDown={(e) => {
              if (!source) return;
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              dragRef.current = { x: e.clientX, y: e.clientY, crop };
            }}
            onPointerMove={(e) => {
              const drag = dragRef.current;
              if (!drag || !source) return;
              const dx = (e.clientX - drag.x) / 120;
              const dy = (e.clientY - drag.y) / 120;
              const next = {
                ...drag.crop,
                x: Math.max(-1, Math.min(1, drag.crop.x + dx)),
                y: Math.max(-1, Math.min(1, drag.crop.y + dy)),
              };
              setCrop(next);
            }}
            onPointerUp={() => {
              if (!source || !dragRef.current) {
                dragRef.current = null;
                return;
              }
              const next = crop;
              dragRef.current = null;
              void bake(source, next);
            }}
            onPointerCancel={() => {
              dragRef.current = null;
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={source ?? bgImage ?? ""}
              alt="Bookmark face crop"
              draggable={false}
              style={
                source
                  ? {
                      transform: `translate(${crop.x * (12 * crop.zoom)}%, ${crop.y * (12 * crop.zoom)}%) scale(${crop.zoom})`,
                    }
                  : undefined
              }
            />
            <span className="image-cropper-hint">{busy ? "Updating…" : "Drag to pan"}</span>
          </div>
          <label className="image-zoom">
            <span>Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={crop.zoom}
              disabled={!source}
              onChange={(e) => updateCrop({ zoom: Number(e.target.value) })}
            />
          </label>
        </div>
      ) : (
        <p className="hint" style={{ marginTop: 0 }}>
          A photo or pattern — pan and zoom to frame the face. Share links never include the image.
        </p>
      )}

      <div className="maker-cta-row" style={{ marginTop: "0.75rem" }}>
        <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
          {bgImage ? "Replace image" : "Upload image"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy}
          onClick={() => {
            void (async () => {
              try {
                onError(null);
                const res = await fetch("/patterns/swirls-sample.png");
                if (!res.ok) throw new Error("missing");
                const blob = await res.blob();
                const file = new File([blob], "swirls-sample.png", { type: "image/png" });
                await handlePick(file);
              } catch {
                onError("Could not load the sample texture.");
              }
            })();
          }}
        >
          Try sample swirls
        </button>
        {bgImage ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSource(null);
              setCrop(DEFAULT_CROP);
              onChange(null);
              try {
                sessionStorage.removeItem(SOURCE_KEY);
                sessionStorage.removeItem(CROP_KEY);
              } catch {
                /* ignore */
              }
            }}
          >
            Clear
          </button>
        ) : null}
      </div>
      <p className="hint">Images stay in this tab only — copy-link shares the rest of the design, not your photo.</p>
    </div>
  );
}
