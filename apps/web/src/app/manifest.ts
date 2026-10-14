import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reptilytics",
    short_name: "Reptilytics",
    description: "Record-keeping hub for reptile and amphibian keepers and breeders.",
    start_url: "/animals",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#15935a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
