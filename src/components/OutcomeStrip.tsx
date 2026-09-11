export function OutcomeStrip() {
  return (
    <section className="outcome-strip shell" aria-label="What you get">
      <figure className="outcome-shot">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/outcomes/accordion.png" alt="Finished accordion-fold bookmark in a book" width={640} height={400} />
        <figcaption>Accordion — print, fan-fold, read</figcaption>
      </figure>
      <div className="outcome-copy">
        <p className="outcome-kicker">Printer paper, made intentional</p>
        <p className="outcome-lead">
          Design a bookmark, download a PDF, fold the numbered lines. Preview and print share the same layout — what you see is what folds.
        </p>
      </div>
      <figure className="outcome-shot">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/outcomes/corner.png" alt="Finished corner-pocket bookmark on a page" width={640} height={400} />
        <figcaption>Corner pocket — cut, fold twice, slide on</figcaption>
      </figure>
    </section>
  );
}
