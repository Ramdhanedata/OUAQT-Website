import type { MetadataRoute } from "next";

/*
 * Lets a phone add the site to its home screen with the OUAQT mark, and gives
 * search engines one more place that names the site and its icon.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OUAQT",
    short_name: "OUAQT",
    description:
      "Logiciel de gestion et de caisse pour les PME en Mauritanie. Management and POS software for small businesses in Mauritania.",
    start_url: "/",
    display: "browser",
    background_color: "#f0eee6",
    theme_color: "#f0eee6",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
