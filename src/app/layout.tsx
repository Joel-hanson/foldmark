import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-loaded",
  display: "swap",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Foldmark — dead-simple printable bookmarks",
  description:
    "Pick a shape, type your text, and print a real bookmark at home. A4, Letter, A5, Legal — color or black & white.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body
        style={
          {
            ["--font-display" as string]: "var(--font-display-loaded), Fraunces, serif",
            ["--font-body" as string]:
              "var(--font-body-loaded), 'Source Sans 3', sans-serif",
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
