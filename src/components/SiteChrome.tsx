export function SiteHeader() {
  return (
    <header className="site-header shell">
      <span className="brand" aria-label="Foldmark">
        <span className="brand-mark">Foldmark</span>
        <span className="brand-tag">print · fold · read</span>
      </span>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer shell">
      <span>Foldmark — printer paper, made intentional.</span>
      <span>A4 · Letter · A5 · Legal · color or black &amp; white</span>
    </footer>
  );
}
