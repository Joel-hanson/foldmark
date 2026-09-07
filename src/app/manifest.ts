import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Foldmark",
    short_name: "Foldmark",
    description:
      "Pick a shape, type your text, and print a real bookmark at home. A4, Letter, A5, Legal — color or black & white.",
    start_url: "/",
    display: "standalone",
    background_color: "#eef0ec",
    theme_color: "#2c4a3e",
    orientation: "any",
    categories: ["productivity", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
