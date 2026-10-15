"use client"

import { ArrowRightIcon, TruckIcon } from "lucide-react"
import Link from "next/link"
import { useFormatter, useTranslations } from "next-intl"

import { buttonVariants } from "@/components/ui/button"
import { useStockAccess } from "@/components/workspace/stock-access"
import { StockPermission } from "@/lib/api/stock"
import { useVouchersPage } from "@/lib/api/voucher-queries"
import { TransferState } from "@/lib/api/vouchers"
import { ListQueryParams, RecordRoutes, Routes } from "@/lib/routes"
import { VoucherKind } from "@/lib/vouchers/voucher-kinds"
import { cn } from "@/lib/utils"

/** Envois lus pour l'accueil ; ceux qui arrivent dans ses dépôts y sont listés. */
const PREVIEW = 20
const IN_TRANSIT = { transferState: TransferState.inTransit }

/**
 * Transferts en route vers ses dépôts (DECISIONS.md, D27) : à réceptionner à leur arrivée. Rien
 * s'il n'y en a pas, ou si le rôle ne permet pas de réceptionner.
 */
export function TransfersToReceiveCard({ className }: { className?: string }) {
  const t = useTranslations("dashboard.transfers")
  const format = useFormatter()
  const { can, covers } = useStockAccess()
  const transfers = useVouchersPage(IN_TRANSIT, 0, PREVIEW)
  const arriving = (transfers.data?.items ?? []).filter(
    (transfer) => transfer.destination && covers(transfer.destination.id)
  )
  if (!can(StockPermission.recordMovements) || arriving.length === 0)
    return null

  return (
    <section
      className={cn(
        "rounded-2xl border border-primary/30 bg-primary/5 p-5",
        className
      )}
      aria-labelledby="transfers-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="transfers-title"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <TruckIcon className="size-5" aria-hidden />
          {t("title", { count: arriving.length })}
        </h2>
        <Link
          href={`${Routes.vouchers}?${ListQueryParams.voucherType}=${VoucherKind.inTransit}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          {t("seeAll")}
          <ArrowRightIcon className="size-4" aria-hidden />
        </Link>
      </div>
      <ul className="mt-4 divide-y rounded-xl border bg-background">
        {arriving.map((transfer) => (
          <li
            key={transfer.id}
            className="flex flex-wrap items-center gap-3 p-3"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={RecordRoutes.voucher(transfer.id)}
                className="font-mono font-semibold hover:underline"
              >
                {transfer.number}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {t("route", {
                  source: transfer.warehouse.name,
                  destination: transfer.destination?.name ?? "",
                  date: format.dateTime(new Date(transfer.occurredAt), {
                    dateStyle: "medium",
                  }),
                })}
              </p>
            </div>
            <Link
              href={RecordRoutes.transferReceipt(transfer.id)}
              className={buttonVariants({ size: "sm" })}
            >
              {t("receive")}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
