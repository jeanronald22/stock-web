import type { PdfFooter, PdfLetterhead } from "@/lib/pdf/pdf-letterhead"

/**
 * Contenu d'un bon prêt à mettre en page : textes déjà traduits et mis en forme (dates, quantités),
 * logo déjà converti ; le document PDF n'a ni accès aux traductions ni à l'API.
 */
export type VoucherPdfData = {
  fileName: string
  letterhead: PdfLetterhead
  title: string
  number: string
  facts: { label: string; value: string }[]
  columns: { item: string; batch: string; entered: string; quantity: string }
  lines: {
    name: string
    reference: string | null
    /** « Empl. A-03-2 » : où prendre ou ranger l'article (D37). */
    location: string | null
    batch: string
    entered: string
    quantity: string
  }[]
  lineCount: string
  note: { label: string; text: string } | null
  signatures: { label: string; name: string }[]
  footer: PdfFooter
}
