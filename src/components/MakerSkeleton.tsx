export function MakerSkeleton() {
  return (
    <div className="maker shell" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading Foldmark…</span>
      <div className="maker-top">
        <div className="skeleton-stack" style={{ flex: 1, maxWidth: "34rem" }}>
          <div className="skeleton-block skeleton-title" />
          <div className="skeleton-block skeleton-lead" />
          <div className="skeleton-block skeleton-lead skeleton-lead-short" />
        </div>
        <div className="maker-cta-row">
          <div className="skeleton-block skeleton-btn" />
          <div className="skeleton-block skeleton-btn" />
        </div>
      </div>

      <div className="maker-layout">
        <section className="panel skeleton-panel" aria-hidden="true">
          <div className="skeleton-block skeleton-kicker" />
          <div className="skeleton-shape-row">
            <div className="skeleton-block skeleton-shape" />
            <div className="skeleton-block skeleton-shape" />
            <div className="skeleton-block skeleton-shape" />
          </div>

          <div className="skeleton-block skeleton-kicker" style={{ marginTop: "1.5rem" }} />
          <div className="skeleton-chip-row">
            <div className="skeleton-block skeleton-chip" />
            <div className="skeleton-block skeleton-chip" />
            <div className="skeleton-block skeleton-chip" />
            <div className="skeleton-block skeleton-chip" />
          </div>
          <div className="skeleton-block skeleton-field" />
          <div className="skeleton-block skeleton-field" />

          <div className="skeleton-block skeleton-kicker" style={{ marginTop: "1.5rem" }} />
          <div className="skeleton-swatch-row">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="skeleton-block skeleton-swatch" />
            ))}
          </div>

          <div className="skeleton-block skeleton-kicker" style={{ marginTop: "1.5rem" }} />
          <div className="skeleton-pattern-row">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="skeleton-block skeleton-pattern" />
            ))}
          </div>
        </section>

        <aside className="preview-pane" aria-hidden="true">
          <div className="preview-card skeleton-preview">
            <div className="skeleton-block skeleton-bookmark" />
          </div>
          <div className="skeleton-block skeleton-hint" />
          <div className="sheet-card skeleton-sheet">
            <div className="skeleton-block skeleton-sheet-inner" />
          </div>
          <div className="skeleton-block skeleton-hint" />
        </aside>
      </div>
    </div>
  );
}
