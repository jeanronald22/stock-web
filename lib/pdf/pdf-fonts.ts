import { Font } from "@react-pdf/renderer"

/** Inter, la police de l'application (licence OFL, public/fonts) : accents et espaces fines des nombres. */
export const PDF_FONT = "Inter"

Font.register({
  family: PDF_FONT,
  fonts: [
    { src: "/fonts/inter-400.woff", fontWeight: 400 },
    { src: "/fonts/inter-600.woff", fontWeight: 600 },
    { src: "/fonts/inter-700.woff", fontWeight: 700 },
  ],
})
// Pas de césure automatique : un nom d'article reste entier.
Font.registerHyphenationCallback((word) => [word])
