"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useFormatter, useTranslations } from "next-intl"
import { useCallback, useState } from "react"
import { toast } from "sonner"

import { useCategoryTree } from "@/components/categories/use-category-tree"
import { usePdfLetterhead } from "@/components/pdf/use-pdf-letterhead"
import { useStockAccess } from "@/components/workspace/stock-access"
import { useApi } from "@/lib/api/api-provider"
import {
  CatalogStatus,
  StockState,
  type Item,
  type Warehouse,
} from "@/lib/api/stock"
import { stockKeys } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { useFileUrl } from "@/lib/api/use-file-url"
import { voucherKeys } from "@/lib/api/voucher-queries"
import {
  SheetTone,
  type ItemSheet,
  type ItemSheetPdfData,
  type SheetState,
} from "@/lib/items/pdf/item-sheet-pdf-data"
import { drawBarcode } from "@/lib/labels/barcode"
import { useActiveOrganization } from "@/lib/organization/active-organization"
import { downloadBlob } from "@/lib/pdf/pdf-output"
import { pdfImage } from "@/lib/pdf/pdf-image"

import { usePackagingBreakdown, useQuantityLabel } from "./describe"
import { itemWarehouses } from "./use-item-warehouses"

/** Au-delà, le PDF devient long à produire sur un téléphone : on exporte en plusieurs fois. */
export const MAX_ITEM_SHEETS = 50
const SINGLE_FILE = (reference: string) => `fiche-${reference}.pdf`
const MANY_FILE = "fiches-articles.pdf"

/**
 * Fiches d'articles en PDF, au nom de l'entreprise : une page par article, téléchargée. Les
 * stocks et les dépôts viennent du cache quand ils y sont ; la bibliothèque PDF n'est chargée qu'au
 * premier export.
 */
export function useItemSheetPdf() {
  const t = useTranslations()
  const format = useFormatter()
  const quantityLabel = useQuantityLabel()
  const packagingBreakdown = usePackagingBreakdown()
  const errorMessage = useErrorMessage()
  const fileUrl = useFileUrl()
  const queryClient = useQueryClient()
  const { stock, vouchers } = useApi()
  const { activeOrganizationId } = useActiveOrganization()
  const pdf = usePdfLetterhead()
  const { covers } = useStockAccess()
  const { paths } = useCategoryTree()
  const [busy, setBusy] = useState(false)

  const stateOf = useCallback(
    (state: StockState, quantity: number): SheetState =>
      state === StockState.out
        ? { label: t("stock.state.OUT"), tone: SheetTone.out }
        : state === StockState.low
          ? { label: t("stock.state.LOW"), tone: SheetTone.low }
          : quantity > 0
            ? { label: t("stock.state.inStock"), tone: SheetTone.ok }
            : { label: t("stock.state.empty"), tone: SheetTone.empty },
    [t]
  )

  const sheetOf = useCallback(
    async (item: Item, warehouses: Warehouse[]): Promise<ItemSheet> => {
      const [itemStock, photos, barcode] = await Promise.all([
        queryClient.fetchQuery({
          queryKey: voucherKeys.itemStock(activeOrganizationId, item.id),
          queryFn: () => vouchers.itemStock(item.id),
        }),
        Promise.all(
          item.images.map((image) => pdfImage(fileUrl(image.url) ?? image.url))
        ),
        item.barcode
          ? drawBarcode(item.barcode).catch(() => null)
          : Promise.resolve(null),
      ])
      const { lines, total, state } = itemWarehouses(
        item,
        warehouses,
        itemStock,
        covers
      )
      const loaded = photos.filter((photo): photo is string => !!photo)
      const breakdown = packagingBreakdown(item, total)
      const missing = t("items.detail.missing")
      return {
        name: item.name,
        reference: item.reference,
        category: item.categoryId ? (paths.get(item.categoryId) ?? null) : null,
        badge:
          item.status === CatalogStatus.archived
            ? t("items.restore.badge")
            : null,
        photo: loaded[0] ?? null,
        otherPhotos: loaded.slice(1),
        state: stateOf(state, total),
        total: quantityLabel(item.baseUnit, total),
        packs: breakdown && t("items.detail.breakdown", { breakdown }),
        // La référence est le numéro de la fiche, en tête : elle n'est pas répétée ici.
        facts: [
          {
            label: t("items.detail.barcode"),
            value: item.barcode ?? missing,
          },
          {
            label: t("items.detail.unit"),
            value: t(`units.${item.baseUnit}.label`),
          },
          {
            label: t("items.detail.batchTracking"),
            value: item.batchTracking
              ? t("items.detail.byBatch")
              : t("items.detail.noBatch"),
          },
          {
            label: t("items.detail.packagings"),
            value:
              item.packagings
                .map(
                  (packaging) =>
                    `${packaging.name} = ${quantityLabel(item.baseUnit, packaging.quantity)}`
                )
                .join(" · ") || t("items.detail.noPackaging"),
          },
          {
            label: t("items.detail.createdAt"),
            value: format.dateTime(new Date(item.createdAt), {
              dateStyle: "long",
            }),
          },
        ],
        barcode:
          item.barcode && barcode
            ? { code: item.barcode, shape: barcode }
            : null,
        description: item.description,
        warehouses: lines.map((line) => {
          const quantity = line.stock?.quantity ?? 0
          return {
            name: line.warehouse.name,
            location: line.location?.code ?? null,
            quantity: quantityLabel(item.baseUnit, quantity),
            threshold:
              line.minQuantity === null
                ? "—"
                : quantityLabel(item.baseUnit, line.minQuantity),
            state: stateOf(line.state, quantity),
          }
        }),
      }
    },
    [
      queryClient,
      activeOrganizationId,
      vouchers,
      fileUrl,
      covers,
      packagingBreakdown,
      t,
      paths,
      stateOf,
      quantityLabel,
      format,
    ]
  )

  const download = useCallback(
    /** true une fois le PDF enregistré ; false après un échec, déjà signalé. */
    async (items: Item[]): Promise<boolean> => {
      if (items.length === 0) return false
      setBusy(true)
      try {
        const warehouses = await queryClient.fetchQuery({
          queryKey: stockKeys.warehouses(
            activeOrganizationId,
            CatalogStatus.active
          ),
          queryFn: () => stock.warehouses(CatalogStatus.active),
        })
        // L'un après l'autre : cinquante fiches et leurs photos ne se chargent pas d'un coup.
        const sheets: ItemSheet[] = []
        for (const item of items.slice(0, MAX_ITEM_SHEETS))
          sheets.push(await sheetOf(item, warehouses))
        const data: ItemSheetPdfData = {
          fileName:
            sheets.length === 1 ? SINGLE_FILE(sheets[0].reference) : MANY_FILE,
          letterhead: await pdf.letterhead(),
          labels: {
            title: t("items.sheet.title"),
            identification: t("items.sheet.identification"),
            availability: t("items.sheet.availability"),
            warehouse: t("items.sheet.warehouse"),
            location: t("items.sheet.location"),
            quantity: t("items.sheet.quantity"),
            threshold: t("items.sheet.threshold"),
            state: t("items.sheet.state"),
            total: t("items.sheet.total"),
            noWarehouse: t("items.detail.noWarehouse"),
            description: t("items.detail.description"),
            otherPhotos: t("items.sheet.otherPhotos"),
            noPhoto: t("items.sheet.noPhoto"),
          },
          footer: pdf.footer(
            t("items.sheet.footer", {
              date: format.dateTime(new Date(), {
                dateStyle: "long",
                timeStyle: "short",
              }),
            })
          ),
          sheets,
        }
        const [{ pdf: render }, { ItemSheetPdfDocument }] = await Promise.all([
          import("@react-pdf/renderer"),
          import("@/lib/items/pdf/item-sheet-pdf-document"),
        ])
        downloadBlob(
          await render(<ItemSheetPdfDocument data={data} />).toBlob(),
          data.fileName
        )
        toast.success(t("items.sheet.done", { count: sheets.length }))
        return true
      } catch (error) {
        toast.error(errorMessage(error))
        return false
      } finally {
        setBusy(false)
      }
    },
    [
      queryClient,
      activeOrganizationId,
      stock,
      sheetOf,
      pdf,
      t,
      format,
      errorMessage,
    ]
  )

  return { download, busy }
}
