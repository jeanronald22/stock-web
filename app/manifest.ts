import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kreskala Stock",
    short_name: "Kreskala",
    description: "Votre stock, au carton près.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#007A55",
    icons: [
      {
        src: "/brand/png/kreskala-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/png/kreskala-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/png/kreskala-icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/brand/png/kreskala-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
