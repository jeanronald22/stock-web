"use client"

import { ArrowLeftIcon, PrinterIcon } from "lucide-react"
import Link from "next/link"
import { useFormatter, useTranslations } from "next-intl"

import { Splash } from "@/components/app/splash"
import { KreskalaLogo } from "@/components/brand/kreskala-logo"
import { useQuantityLabel } from "@/components/items/describe"
import { ItemThumb } from "@/components/items/item-thumb"
import { Button, buttonVariants } from "@/components/ui/button"
import { useWorkspace } from "@/components/workspace/workspace-context"
import { useVoucher } from "@/lib/api/voucher-queries"
import { VoucherType, type Voucher } from "@/lib/api/vouchers"
import { RecordRoutes } from "@/lib/routes"

/**
 * Bon imprimable (A4) : à remettre au livreur ou au client, à signer, à classer. L'impression ou
 * l'enregistrement en PDF passent par le navigateur ; la barre d'outils n'est pas imprimée.
 */
export function VoucherDocument({ id }: { id: string }) {
  const t = useTranslations("common")
  const voucher = useVoucher(id)
  if (!voucher.data) return <Splash label={t("loading")} />
  return <VoucherSheet voucher={voucher.data} />
}

function VoucherSheet({ voucher }: { voucher: Voucher }) {
  const t = useTranslations("vouchers")
  const format = useFormatter()
  const quantityLabel = useQuantityLabel()
  const { organization } = useWorkspace()
  const receipt = voucher.type === VoucherType.receipt
  const facts = [
    { label: t("detail.warehouse"), value: voucher.warehouse.name },
    {
      label: t("detail.date"),
      value: format.dateTime(new Date(voucher.occurredAt), {
        dateStyle: "long",
      }),
    },
    {
      label: receipt ? t("detail.supplier") : t("detail.customer"),
      value: voucher.counterparty ?? "—",
    },
    { label: t("detail.reference"), value: voucher.documentReference ?? "—" },
  ]

  return (
    <div className="min-h-dvh bg-muted/40 py-6 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex max-w-[210mm] items-center justify-between gap-3 px-4 print:hidden">
        <Link
          href={RecordRoutes.voucher(voucher.id)}
          className={buttonVariants({ variant: "ghost" })}
        >
          <ArrowLeftIcon />
          {t("print.back")}
        </Link>
        <Button size="lg" onClick={() => void printWhenImagesReady()}>
          <PrinterIcon />
          {t("print.action")}
        </Button>
      </div>

      <article className="voucher-sheet mx-auto flex min-h-[297mm] max-w-[210mm] flex-col bg-white p-[14mm] text-[11pt] text-neutral-900 shadow-sm print:min-h-0 print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-2 border-neutral-900 pb-5">
          <div>
            <p className="text-xl font-bold">{organization.name}</p>
            <p className="text-neutral-600">{organization.city}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold tracking-[0.08em] text-neutral-500 uppercase">
              {receipt ? t("print.receiptTitle") : t("print.issueTitle")}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold">
              {voucher.number}
            </p>
          </div>
        </header>

        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-xs text-neutral-500">{fact.label}</dt>
              <dd className="font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <table className="mt-8 w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-300 text-xs text-neutral-500">
              <th className="py-2 pr-2 font-medium">#</th>
              <th className="py-2 pr-3 font-medium">{t("detail.item")}</th>
              <th className="py-2 pr-3 font-medium">{t("detail.batch")}</th>
              <th className="py-2 pr-3 font-medium">{t("detail.entered")}</th>
              <th className="py-2 text-right font-medium">
                {t("detail.quantity")}
              </th>
            </tr>
          </thead>
          <tbody>
            {voucher.lines.map((line, index) => (
              <tr
                key={`${line.itemId}-${index}`}
                className="break-inside-avoid border-b border-neutral-200"
              >
                <td className="py-2 pr-2 align-middle text-neutral-500 tabular-nums">
                  {index + 1}
                </td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-3">
                    <ItemThumb
                      imageUrl={line.itemImageUrl}
                      eager
                      className="bg-neutral-100 text-emerald-700"
                    />
                    <div>
                      <p className="font-medium">{line.itemName}</p>
                      {line.itemReference && (
                        <p className="font-mono text-xs text-neutral-500">
                          {line.itemReference}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-2 pr-3">{line.batch ?? "—"}</td>
                <td className="py-2 pr-3">
                  {line.packagingName
                    ? `${format.number(line.enteredQuantity)} ${line.packagingName}`
                    : "—"}
                </td>
                <td className="py-2 text-right font-semibold tabular-nums">
                  {quantityLabel(line.baseUnit, line.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-right text-sm text-neutral-600">
          {t("lineCount", { count: voucher.lines.length })}
        </p>

        {voucher.note && (
          <div className="mt-6 break-inside-avoid rounded-lg border border-neutral-300 p-4">
            <p className="text-xs text-neutral-500">{t("detail.note")}</p>
            <p className="mt-1 whitespace-pre-line">{voucher.note}</p>
          </div>
        )}

        <div className="mt-auto grid break-inside-avoid grid-cols-2 gap-8 pt-12">
          <Signature
            label={t("print.validatedBy")}
            name={voucher.createdByName}
          />
          <Signature
            label={receipt ? t("print.deliveredBy") : t("print.receivedBy")}
          />
        </div>

        <footer className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-3 text-xs text-neutral-500">
          <span>
            {t("print.footer", {
              date: format.dateTime(new Date(voucher.recordedAt), {
                dateStyle: "long",
                timeStyle: "short",
              }),
            })}
          </span>
          <KreskalaLogo tone="paper" className="h-4" />
        </footer>
      </article>
    </div>
  )
}

/** Les deux cases ont la même ligne de nom (vide pour l'autre partie) : elles restent alignées. */
function Signature({ label, name }: { label: string; name?: string }) {
  const t = useTranslations("vouchers.print")
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="min-h-6 font-semibold">{name}</p>
      <div
        className="mt-2 h-20 rounded-lg border border-dashed border-neutral-400"
        aria-label={t("signature")}
      />
    </div>
  )
}

/** Imprime une fois toutes les photos chargées : sinon le PDF peut sortir sans elles. */
async function printWhenImagesReady() {
  const images = Array.from(
    document.querySelectorAll<HTMLImageElement>(".voucher-sheet img")
  )
  await Promise.all(
    images.map((image) => image.decode().catch(() => undefined))
  )
  window.print()
}
