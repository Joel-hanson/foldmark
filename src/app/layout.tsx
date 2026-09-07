import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { RegisterSW } from "@/components/RegisterSW";
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
  applicationName: "Foldmark",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Foldmark",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Foldmark — dead-simple printable bookmarks",
    description:
      "Pick a shape, type your text, and print a real bookmark at home.",
    type: "website",
    siteName: "Foldmark",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2c4a3e" },
    { media: "(prefers-color-scheme: dark)", color: "#2c4a3e" },
  ],
  colorScheme: "light",
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
        <RegisterSW />
      </body>
    </html>
  );
}
