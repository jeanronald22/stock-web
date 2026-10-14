"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useFormatter, useTranslations } from "next-intl"
import { useCallback, useState } from "react"
import { toast } from "sonner"

import { useQuantityLabel } from "@/components/items/describe"
import { useWorkspace } from "@/components/workspace/workspace-context"
import { useApi } from "@/lib/api/api-provider"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { voucherKeys } from "@/lib/api/voucher-queries"
import { VoucherType, type Voucher } from "@/lib/api/vouchers"
import { useActiveOrganization } from "@/lib/organization/active-organization"
import type { VoucherPdfData } from "@/lib/vouchers/pdf/voucher-pdf-data"

const PDF_EXTENSION = ".pdf"
const EMPTY = "—"
/** Une seule fenêtre d'impression à la fois : le cadre précédent est remplacé. */
let printFrame: HTMLIFrameElement | null = null

/**
 * Bon en PDF, généré dans l'application : téléchargé tel quel, ou imprimé (même document, pied de
 * page en bas de chaque page). La bibliothèque PDF n'est chargée qu'au premier usage.
 */
export function useVoucherPdf() {
  const t = useTranslations("vouchers")
  const format = useFormatter()
  const quantityLabel = useQuantityLabel()
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const { vouchers } = useApi()
  const { activeOrganizationId } = useActiveOrganization()
  const { organization } = useWorkspace()
  const [busy, setBusy] = useState(false)

  const toData = useCallback(
    (voucher: Voucher): VoucherPdfData => {
      const receipt = voucher.type === VoucherType.receipt
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
      const party =
        from && to
          ? []
          : [
              {
                label: receipt ? t("detail.supplier") : t("detail.customer"),
                value: voucher.counterparty ?? EMPTY,
              },
            ]
      return {
        fileName: voucher.number + PDF_EXTENSION,
        organization: { name: organization.name, city: organization.city },
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
          batch: line.batch ?? EMPTY,
          entered: line.packagingName
            ? `${format.number(line.enteredQuantity)} ${line.packagingName}`
            : EMPTY,
          quantity:
            line.expectedQuantity !== null &&
            line.expectedQuantity !== line.quantity
              ? t("print.receivedOf", {
                  received: quantityLabel(line.baseUnit, line.quantity),
                  expected: quantityLabel(line.baseUnit, line.expectedQuantity),
                })
              : quantityLabel(line.baseUnit, line.quantity),
        })),
        lineCount: t("lineCount", { count: voucher.lines.length }),
        note: voucher.note
          ? { label: t("detail.note"), text: voucher.note }
          : null,
        signatures: [
          { label: t("print.validatedBy"), name: voucher.createdByName },
          {
            label: receipt ? t("print.deliveredBy") : t("print.receivedBy"),
            name: "",
          },
        ],
        footer: t("print.footer", {
          date: format.dateTime(new Date(voucher.recordedAt), {
            dateStyle: "long",
            timeStyle: "short",
          }),
        }),
      }
    },
    [t, format, quantityLabel, organization]
  )

  const render = useCallback(
    async (voucherId: string) => {
      const voucher = await queryClient.fetchQuery({
        queryKey: voucherKeys.voucher(activeOrganizationId, voucherId),
        queryFn: () => vouchers.voucher(voucherId),
      })
      const [{ pdf }, { VoucherPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/vouchers/pdf/voucher-pdf-document"),
      ])
      const data = toData(voucher)
      return {
        blob: await pdf(<VoucherPdfDocument data={data} />).toBlob(),
        fileName: data.fileName,
      }
    },
    [queryClient, activeOrganizationId, vouchers, toData]
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
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = fileName
        link.click()
        // Le navigateur a lu le fichier : l'adresse temporaire peut être libérée.
        window.setTimeout(() => URL.revokeObjectURL(url))
      }),
    [run, render]
  )

  const print = useCallback(
    (voucherId: string) =>
      run(async () => {
        const { blob } = await render(voucherId)
        const url = URL.createObjectURL(blob)
        printFrame?.remove()
        const frame = document.createElement("iframe")
        frame.setAttribute("aria-hidden", "true")
        frame.tabIndex = -1
        Object.assign(frame.style, {
          position: "fixed",
          right: "0",
          bottom: "0",
          width: "0",
          height: "0",
          border: "0",
        })
        frame.onload = () => {
          try {
            frame.contentWindow?.print()
          } catch {
            // Navigateur qui n'imprime pas un PDF dans un cadre : il s'ouvre dans un nouvel onglet.
            window.open(url, "_blank", "noopener")
          }
        }
        frame.src = url
        document.body.append(frame)
        printFrame = frame
      }),
    [run, render]
  )

  return { download, print, busy }
}
