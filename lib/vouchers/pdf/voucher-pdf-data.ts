/**
 * Contenu d'un bon prêt à mettre en page : textes déjà traduits et mis en forme (dates, quantités),
 * le document PDF n'a ni accès aux traductions ni à l'API.
 */
export type VoucherPdfData = {
  fileName: string
  organization: { name: string; city: string }
  title: string
  number: string
  facts: { label: string; value: string }[]
  columns: { item: string; batch: string; entered: string; quantity: string }
  lines: {
    name: string
    reference: string | null
    batch: string
    entered: string
    quantity: string
  }[]
  lineCount: string
  note: { label: string; text: string } | null
  signatures: { label: string; name: string }[]
  footer: string
}
