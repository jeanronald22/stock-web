"use client"

import { CheckIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { useStockAccess } from "@/components/workspace/stock-access"
import { InventoryStatus } from "@/lib/api/inventories"
import { useInventories } from "@/lib/api/inventory-queries"
import { useRequests } from "@/lib/api/request-queries"
import type { ActivityAnalysis } from "@/lib/api/reports"
import { StockPermission } from "@/lib/api/stock"
import { RequestStatus } from "@/lib/api/voucher-requests"
import { ListQueryParams, Routes, StockAlertParam } from "@/lib/routes"
import { cn } from "@/lib/utils"
import { VoucherKind } from "@/lib/vouchers/voucher-kinds"

import { useArrivingTransfers } from "./transfers-to-receive-card"

/** Ton d'une pastille : à faire bientôt, ou tout de suite. */
const AlertTone = { warning: "warning", urgent: "urgent" } as const
type AlertTone = (typeof AlertTone)[keyof typeof AlertTone]

const TONES: Record<AlertTone, string> = {
  [AlertTone.warning]:
    "border-warning/50 text-warning-muted-foreground hover:bg-warning-muted",
  [AlertTone.urgent]:
    "border-destructive/40 text-destructive-muted-foreground hover:bg-destructive-muted",
}

type Alert = {
  key: string
  label: string
  href: string
  tone: AlertTone
  count: number
}

/**
 * Ce qui attend une décision ou un geste (D43), en pastilles qui ouvrent la liste concernée : sorties
 * à valider, transferts à réceptionner, ruptures, articles à commander, inventaires en cours,
 * réceptions avec écart. Rien ne presse : on le dit.
 */
export function BoardAlerts({
  analysis,
  reportQuery,
}: {
  analysis: ActivityAnalysis | undefined
  reportQuery: string
}) {
  const t = useTranslations("dashboard.board.alerts")
  const { can } = useStockAccess()
  const decides = can(StockPermission.correctStock)
  const requests = useRequests(RequestStatus.pending, 0, 1).data?.total ?? 0
  const inventories =
    useInventories(InventoryStatus.open, 0, 1).data?.total ?? 0
  const arriving = useArrivingTransfers().length
  const out = analysis?.stock.out ?? 0
  const low = (analysis?.stock.alerts ?? 0) - out
  const gaps = analysis?.receiptsWithDiscrepancy ?? 0
  const stock = (alert: StockAlertParam) =>
    `${Routes.stock}?${ListQueryParams.stockAlert}=${alert}`

  const alerts: Alert[] = [
    {
      key: "requests",
      label: decides
        ? t("requests", { count: requests })
        : t("requestsWaiting", { count: requests }),
      href: Routes.requests,
      tone: AlertTone.warning,
      count: requests,
    },
    {
      key: "transfers",
      label: t("transfers", { count: arriving }),
      href: `${Routes.vouchers}?${ListQueryParams.voucherType}=${VoucherKind.inTransit}`,
      tone: AlertTone.warning,
      count: arriving,
    },
    {
      key: "out",
      label: t("out", { count: out }),
      href: stock(StockAlertParam.out),
      tone: AlertTone.urgent,
      count: out,
    },
    {
      key: "low",
      label: t("low", { count: low }),
      href: stock(StockAlertParam.low),
      tone: AlertTone.warning,
      count: low,
    },
    {
      key: "inventories",
      label: t("inventories", { count: inventories }),
      href: Routes.stock,
      tone: AlertTone.warning,
      count: inventories,
    },
    {
      key: "gaps",
      label: t("gaps", { count: gaps }),
      href: `${Routes.reportsDiscrepancies}?${reportQuery}`,
      tone: AlertTone.warning,
      count: gaps,
    },
  ].filter((alert) => alert.count > 0)

  return (
    <nav aria-label={t("label")} className="flex flex-wrap gap-2">
      {alerts.length === 0 ? (
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 text-sm font-medium text-primary">
          <CheckIcon className="size-4" aria-hidden />
          {t("none")}
        </span>
      ) : (
        alerts.map((alert) => (
          <Link
            key={alert.key}
            href={alert.href}
            className={cn(
              "inline-flex h-8 items-center rounded-full border bg-background px-3 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none",
              TONES[alert.tone]
            )}
          >
            {alert.label}
          </Link>
        ))
      )}
    </nav>
  )
}
