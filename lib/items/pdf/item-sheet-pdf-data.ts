import type { BarcodeShape } from "@/lib/labels/barcode"
import type { PdfFooter, PdfLetterhead } from "@/lib/pdf/pdf-letterhead"

/** Ton d'un état de stock, pour sa pastille : en stock, bas, rupture, épuisé. */
export const SheetTone = {
  ok: "ok",
  low: "low",
  out: "out",
  empty: "empty",
} as const
export type SheetTone = (typeof SheetTone)[keyof typeof SheetTone]

export type SheetState = { label: string; tone: SheetTone }

/**
 * Fiche d'un article prête à mettre en page : textes déjà traduits et mis en forme, photos déjà
 * converties en JPEG (data URL) ; le document PDF n'a accès ni aux traductions ni à l'API.
 */
export type ItemSheet = {
  name: string
  reference: string
  category: string | null
  /** « Archivé » : l'article n'est plus proposé. */
  badge: string | null
  photo: string | null
  otherPhotos: string[]
  state: SheetState
  total: string
  /** « soit 25 × Carton + 2 pièces ». */
  packs: string | null
  facts: { label: string; value: string }[]
  barcode: { code: string; shape: BarcodeShape } | null
  description: string | null
  warehouses: {
    name: string
    location: string | null
    quantity: string
    threshold: string
    state: SheetState
  }[]
}

export type ItemSheetPdfData = {
  fileName: string
  letterhead: PdfLetterhead
  labels: {
    title: string
    identification: string
    availability: string
    warehouse: string
    location: string
    quantity: string
    threshold: string
    state: string
    total: string
    noWarehouse: string
    description: string
    otherPhotos: string
    noPhoto: string
  }
  footer: PdfFooter
  sheets: ItemSheet[]
}
