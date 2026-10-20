"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useFormatter, useTranslations } from "next-intl"
import { useCallback, useState } from "react"
import { toast } from "sonner"

import { useBatchLabel, useQuantityLabel } from "@/components/items/describe"
import { usePdfLetterhead } from "@/components/pdf/use-pdf-letterhead"
import { useApi } from "@/lib/api/api-provider"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { voucherKeys } from "@/lib/api/voucher-queries"
import {
  incomingTypes,
  supplierTypes,
  VoucherType,
  type Voucher,
} from "@/lib/api/vouchers"
import { useActiveOrganization } from "@/lib/organization/active-organization"
import type { PdfLetterhead } from "@/lib/pdf/pdf-letterhead"
import { downloadBlob, printBlob } from "@/lib/pdf/pdf-output"
import type { VoucherPdfData } from "@/lib/vouchers/pdf/voucher-pdf-data"

const PDF_EXTENSION = ".pdf"
const EMPTY = "—"

/**
 * Bon en PDF, généré dans l'application : téléchargé tel quel, ou imprimé (même document, pied de
 * page en bas de chaque page). La bibliothèque PDF n'est chargée qu'au premier usage.
 */
export function useVoucherPdf() {
  const t = useTranslations("vouchers")
  const format = useFormatter()
  const quantityLabel = useQuantityLabel()
  const batchLabel = useBatchLabel()
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const { vouchers } = useApi()
  const { activeOrganizationId } = useActiveOrganization()
  const pdf = usePdfLetterhead()
  const [busy, setBusy] = useState(false)

  const toData = useCallback(
    (voucher: Voucher, letterhead: PdfLetterhead): VoucherPdfData => {
      // La marchandise arrive (réception, retour client) : on signe qui l'a livrée.
      const incoming = incomingTypes.has(voucher.type)
      // Transfert : départ et arrivée ; l'autre bout n'est ni un fournisseur ni un client.
      const from = voucher.destination ? voucher.warehouse : voucher.source
      const to =
        voucher.destination ?? (voucher.source ? voucher.warehouse : null)
      const places =
        from && to
          ? [
              { label: t("detail.from"), value: from.name },
              { label: t("detail.to"), value: to.name },
            ]
          : [{ label: t("detail.warehouse"), value: voucher.warehouse.name }]
      // Casse et ajustement : pas de tiers, mais un motif.
      const party = voucher.reason
        ? [
            {
              label: t("detail.reason"),
              value: t(`reasons.${voucher.reason}.label`),
            },
          ]
        : from && to
          ? []
          : [
              {
                label: supplierTypes.has(voucher.type)
                  ? t("detail.supplier")
                  : t("detail.customer"),
                value: voucher.counterparty ?? EMPTY,
              },
            ]
      return {
        fileName: voucher.number + PDF_EXTENSION,
        letterhead,
        title: t(`print.titles.${voucher.type}`),
        number: voucher.number,
        facts: [
          ...places,
          {
            label: t("detail.date"),
            value: format.dateTime(new Date(voucher.occurredAt), {
              dateStyle: "long",
            }),
          },
          ...party,
          {
            label: t("detail.reference"),
            value: voucher.documentReference ?? EMPTY,
          },
        ],
        columns: {
          item: t("detail.item"),
          batch: t("detail.batch"),
          entered: t("detail.entered"),
          quantity: t("detail.quantity"),
        },
        lines: voucher.lines.map((line) => ({
          name: line.itemName,
          reference: line.itemReference,
          location: line.location
            ? t("print.location", { code: line.location.code })
            : null,
          batch: line.batch ? batchLabel(line.batch, line) : EMPTY,
          entered: line.packagingName
            ? `${format.number(line.enteredQuantity)} ${line.packagingName}`
            : EMPTY,
          quantity:
            voucher.type === VoucherType.adjustment
              ? t("print.countedOf", {
                  counted: quantityLabel(line.baseUnit, line.quantity),
                  book: quantityLabel(
                    line.baseUnit,
                    line.expectedQuantity ?? 0
                  ),
                })
              : line.expectedQuantity !== null &&
                  line.expectedQuantity !== line.quantity
                ? t("print.receivedOf", {
                    received: quantityLabel(line.baseUnit, line.quantity),
                    expected: quantityLabel(
                      line.baseUnit,
                      line.expectedQuantity
                    ),
                  })
                : quantityLabel(line.baseUnit, line.quantity),
        })),
        lineCount: t("lineCount", { count: voucher.lines.length }),
        note: voucher.note
          ? { label: t("detail.note"), text: voucher.note }
          : null,
        signatures: [
          ...(voucher.preparedByName
            ? [{ label: t("print.preparedBy"), name: voucher.preparedByName }]
            : []),
          { label: t("print.validatedBy"), name: voucher.createdByName },
          {
            label: voucher.reason
              ? t("print.witnessedBy")
              : incoming
                ? t("print.deliveredBy")
                : t("print.receivedBy"),
            name: "",
          },
        ],
        footer: pdf.footer(
          t("print.footer", {
            date: format.dateTime(new Date(voucher.recordedAt), {
              dateStyle: "long",
              timeStyle: "short",
            }),
          })
        ),
      }
    },
    [t, format, quantityLabel, batchLabel, pdf]
  )

  const render = useCallback(
    async (voucherId: string) => {
      const [voucher, letterhead, { pdf: render }, { VoucherPdfDocument }] =
        await Promise.all([
          queryClient.fetchQuery({
            queryKey: voucherKeys.voucher(activeOrganizationId, voucherId),
            queryFn: () => vouchers.voucher(voucherId),
          }),
          pdf.letterhead(),
          import("@react-pdf/renderer"),
          import("@/lib/vouchers/pdf/voucher-pdf-document"),
        ])
      const data = toData(voucher, letterhead)
      return {
        blob: await render(<VoucherPdfDocument data={data} />).toBlob(),
        fileName: data.fileName,
      }
    },
    [queryClient, activeOrganizationId, vouchers, pdf, toData]
  )

  const run = useCallback(
    async (action: () => Promise<void>) => {
      setBusy(true)
      try {
        await action()
      } catch (error) {
        toast.error(errorMessage(error))
      } finally {
        setBusy(false)
      }
    },
    [errorMessage]
  )

  const download = useCallback(
    (voucherId: string) =>
      run(async () => {
        const { blob, fileName } = await render(voucherId)
        downloadBlob(blob, fileName)
      }),
    [run, render]
  )

  const print = useCallback(
    (voucherId: string) =>
      run(async () => printBlob((await render(voucherId)).blob)),
    [run, render]
  )

  return { download, print, busy }
}
