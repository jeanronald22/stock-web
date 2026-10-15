"use client"

import {
  ArrowDownToLineIcon,
  ArrowRightLeftIcon,
  ArrowUpFromLineIcon,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useMemo } from "react"

import { useStockAccess } from "@/components/workspace/stock-access"
import { Skeleton } from "@/components/ui/skeleton"
import { StockPermission } from "@/lib/api/stock"
import { useActivitySummary } from "@/lib/api/report-queries"
import { VoucherType } from "@/lib/api/vouchers"
import { INBOUND_TYPES, OUTBOUND_TYPES, totalOf } from "@/lib/reports/activity"
import { isoDay } from "@/lib/reports/periods"
import { ListQueryParams, Routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

type QuickAction = {
  key: "receipt" | "issue" | "transfer"
  href: string
  icon: LucideIcon
}

const ACTIONS: QuickAction[] = [
  { key: "receipt", href: Routes.newReceipt, icon: ArrowDownToLineIcon },
  { key: "issue", href: Routes.newIssue, icon: ArrowUpFromLineIcon },
  { key: "transfer", href: Routes.newTransfer, icon: ArrowRightLeftIcon },
]

/**
 * Magasinier (D38) : ses gestes du jour en grand, à portée de pouce sur le téléphone, puis ce qui
 * s'est fait aujourd'hui dans ses dépôts.
 */
export function StorekeeperOverview() {
  const t = useTranslations("dashboard.storekeeper")
  const records = useStockAccess().can(StockPermission.recordMovements)
  const today = useMemo(() => {
    const day = isoDay(new Date())
    return { from: day, to: day }
  }, [])
  const summary = useActivitySummary(today)
  const totals = summary.data?.totals

  return (
    <div className="space-y-6">
      {records && (
        <nav aria-label={t("actions")} className="grid gap-3 sm:grid-cols-3">
          {ACTIONS.map((action, index) => (
            <Link
              key={action.key}
              href={action.href}
              className={cn(
                "group flex items-center gap-4 rounded-2xl border p-4 transition-colors hover:border-foreground/20 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none sm:flex-col sm:items-start sm:p-5",
                index === 0 &&
                  "border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary/90"
              )}
            >
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl",
                  index === 0 ? "bg-primary-foreground/15" : "bg-muted"
                )}
                aria-hidden
              >
                <action.icon className="size-5" />
              </span>
              <span>
                <span className="block text-lg font-semibold">
                  {t(`${action.key}.title`)}
                </span>
                <span
                  className={cn(
                    "block text-sm",
                    index === 0
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  )}
                >
                  {t(`${action.key}.description`)}
                </span>
              </span>
            </Link>
          ))}
        </nav>
      )}

      <section
        aria-labelledby="today-title"
        className="rounded-2xl border p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="today-title" className="font-semibold">
            {t("today")}
          </h2>
          <Link
            href={`${Routes.vouchers}?${ListQueryParams.from}=${today.from}&${ListQueryParams.to}=${today.to}`}
            className="text-sm font-semibold text-primary"
          >
            {t("todayVouchers")}
          </Link>
        </div>
        {!totals ? (
          <Skeleton className="mt-3 h-14 rounded-xl" />
        ) : (
          <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
            {(
              [
                { key: "inbound", value: totalOf(totals, INBOUND_TYPES) },
                { key: "outbound", value: totalOf(totals, OUTBOUND_TYPES) },
                { key: "damage", value: totals[VoucherType.damage] ?? 0 },
              ] as const
            ).map((entry) => (
              <div
                key={entry.key}
                className="flex flex-col-reverse rounded-xl bg-muted/50 p-3"
              >
                <dt className="text-xs text-muted-foreground">
                  {t(`counts.${entry.key}`)}
                </dt>
                <dd className="text-2xl font-semibold tabular-nums">
                  {entry.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </div>
  )
}
