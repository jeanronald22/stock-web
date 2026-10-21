import type { MetadataRoute } from "next"

import { Routes } from "@/lib/routes"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kreskala Stock",
    short_name: "Kreskala",
    description: "Votre stock, au carton près.",
    lang: "fr",
    // Le tableau de bord est gardé hors ligne (D39) ; la racine, qui redirige, ne l'est pas.
    start_url: Routes.dashboard,
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
