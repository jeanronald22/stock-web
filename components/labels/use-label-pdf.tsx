"use client"

import { useTranslations } from "next-intl"
import { useCallback, useState } from "react"
import { toast } from "sonner"

import type { Item } from "@/lib/api/stock"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { drawBarcode, type BarcodeShape } from "@/lib/labels/barcode"
import type { LabelFormat } from "@/lib/labels/label-formats"
import type { LabelData } from "@/lib/labels/label-pdf-document"
import { downloadBlob, printBlob } from "@/lib/pdf/pdf-output"

/** Un article et son nombre d'étiquettes. */
export type LabelLine = { item: Item; copies: number }

const FILE_NAME = "etiquettes.pdf"

/**
 * Étiquettes en PDF (D36), générées dans l'application : téléchargées ou imprimées. Chaque code est
 * dessiné une fois, quel que soit son nombre de copies ; les articles sans code sont laissés de côté.
 */
export function useLabelPdf() {
  const t = useTranslations("labels")
  const errorMessage = useErrorMessage()
  const [busy, setBusy] = useState(false)

  const render = useCallback(
    async (lines: LabelLine[], format: LabelFormat, skip: number) => {
      const printable = lines.filter(
        (line): line is LabelLine & { item: { barcode: string } } =>
          !!line.item.barcode && line.copies > 0
      )
      const shapes = new Map<string, BarcodeShape>()
      for (const line of printable) {
        if (!shapes.has(line.item.barcode))
          shapes.set(line.item.barcode, await drawBarcode(line.item.barcode))
      }
      const labels: LabelData[] = printable.flatMap((line) =>
        Array.from({ length: line.copies }, () => ({
          name: line.item.name,
          reference: line.item.reference,
          code: line.item.barcode,
          shape: shapes.get(line.item.barcode)!,
        }))
      )
      const [{ pdf }, { LabelPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/labels/label-pdf-document"),
      ])
      return pdf(
        <LabelPdfDocument
          labels={labels}
          format={format}
          skip={skip}
          title={t("title")}
        />
      ).toBlob()
    },
    [t]
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
    (lines: LabelLine[], format: LabelFormat, skip: number) =>
      run(async () =>
        downloadBlob(await render(lines, format, skip), FILE_NAME)
      ),
    [run, render]
  )
  const print = useCallback(
    (lines: LabelLine[], format: LabelFormat, skip: number) =>
      run(async () => printBlob(await render(lines, format, skip))),
    [run, render]
  )
  return { download, print, busy }
}
