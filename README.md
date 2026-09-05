# Foldmark

A dead-simple printable bookmark maker.

Pick a shape, type your text, download a PDF, cut it out. That's it.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Any Node host works. On Vercel:

```bash
npx vercel
```

Or connect the GitHub repo in the Vercel dashboard — no special config required.

## Shapes

Both are a single cut piece of paper — no origami-folding the whole sheet.

- **Flat strip** — cut it out, no folding at all. The classic bookmark.
- **Corner pocket** — cut a square, fold it twice into a triangular pocket that slides over the page corner.

## How it stays honest

The on-screen preview and the printed PDF are driven by the exact same layout
code (`src/lib/unitPlan.ts` + `src/lib/sheet.ts`): the same draw operations,
the same page-tiling math. What you see is what prints, by construction —
there's no separate hand-tuned drawing routine for each that can drift apart.

## Features

- Two shapes, five color palettes, color or black & white
- A4, Letter, A5, Legal — tiles as many copies as fit per sheet
- Shareable design links (URL state, no account)

## Stack

- Next.js (App Router)
- TypeScript
- `pdf-lib` for client-side PDF generation
