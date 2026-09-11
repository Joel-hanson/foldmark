import { Suspense } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { MakerApp } from "@/components/MakerApp";
import { MakerSkeleton } from "@/components/MakerSkeleton";
import { OutcomeStrip } from "@/components/OutcomeStrip";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <OutcomeStrip />
        <Suspense fallback={<MakerSkeleton />}>
          <MakerApp />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
