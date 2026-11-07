import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cockpit",
    short_name: "Cockpit",
    description: "Persönliches Cockpit für Termine, Abgaben und Projekte",
    start_url: "/",
    display: "standalone",
    background_color: "#070a0e",
    theme_color: "#070a0e",
    lang: "de-CH",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
