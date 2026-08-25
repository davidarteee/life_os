import type { MetadataRoute } from "next";

/**
 * PWA manifest (served at /manifest.webmanifest). Note: for maximum install
 * reliability across all browsers, add raster 192/512 PNG icons in production —
 * documented in docs/PWA.md. The SVG icon covers modern Chromium/Safari.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LifeOS — Personal Operating System",
    short_name: "LifeOS",
    description: "Habits, health, finance, goals and growth — gamified.",
    id: "/",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0e14",
    theme_color: "#0b0e14",
    categories: ["productivity", "lifestyle", "health"],
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
