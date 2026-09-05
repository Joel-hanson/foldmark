import { Suspense } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { MakerApp } from "@/components/MakerApp";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Suspense fallback={<div className="shell maker"><p className="hint">Loading…</p></div>}>
          <MakerApp />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
