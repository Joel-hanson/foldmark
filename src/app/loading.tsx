import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { MakerSkeleton } from "@/components/MakerSkeleton";

export default function Loading() {
  return (
    <>
      <SiteHeader />
      <main>
        <MakerSkeleton />
      </main>
      <SiteFooter />
    </>
  );
}
