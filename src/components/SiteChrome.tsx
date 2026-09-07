import Link from "next/link";
import { FoldmarkLogo } from "@/components/FoldmarkLogo";

export function SiteHeader() {
  return (
    <header className="site-header shell">
      <Link className="brand" href="/" aria-label="Foldmark home">
        <FoldmarkLogo className="brand-logo" />
        <span className="brand-text">
          <span className="brand-mark">Foldmark</span>
          <span className="brand-tag">print · fold · read</span>
        </span>
      </Link>
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
