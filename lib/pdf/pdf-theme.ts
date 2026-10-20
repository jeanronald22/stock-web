/**
 * Charte des documents A4 : sobre et neutre, pour que l'entreprise, son logo et son nom, donne le
 * ton. Couleurs en hexadécimal : le PDF ne lit pas les variables CSS.
 */
export const PdfColors = {
  ink: "#171717",
  muted: "#6B6B6B",
  /** Mention « Édité avec Kreskala » : présente, sans se faire voir. */
  faint: "#A3A3A3",
  rule: "#E5E5E5",
  surface: "#F5F5F5",
  white: "#FFFFFF",
} as const

/** Marges et tailles communes, en points (A4 : 595 × 842). */
export const PdfMetrics = {
  margin: 40,
  footerHeight: 30,
  body: 9.5,
  small: 8,
  caption: 7.5,
} as const
