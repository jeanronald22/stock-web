"use client"

import { ArrowRightIcon, BellRingIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { useQuantityLabel } from "@/components/items/describe"
import { ItemThumb } from "@/components/items/item-thumb"
import { StockGauge } from "@/components/stock/stock-gauge"
import { StockStateBadge } from "@/components/stock/stock-state-badge"
import { StockState } from "@/lib/api/stock"
import { useStockPage } from "@/lib/api/voucher-queries"
import {
  ListQueryParams,
  RecordRoutes,
  Routes,
  StockAlertParam,
} from "@/lib/routes"
import { cn } from "@/lib/utils"

/** Articles montrés sur l'accueil ; la liste complète est sur l'écran Stock. */
const PREVIEW_ALERTS = 5
const ALERTS = { stockStates: [StockState.out, StockState.low] }

/** Articles à commander : au seuil ou en rupture dans au moins un dépôt. Rien sans alerte. */
export function StockAlertsCard({ className }: { className?: string }) {
  const t = useTranslations("dashboard.alerts")
  const quantityLabel = useQuantityLabel()
  const alerts = useStockPage(ALERTS, 0, PREVIEW_ALERTS)
  const total = alerts.data?.total ?? 0
  if (total === 0) return null

  return (
    <section
      className={cn(
        "rounded-2xl border border-warning/40 bg-warning-muted/30 p-5",
        className
      )}
      aria-labelledby="alerts-title"
      data-testid="stock-alerts"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="alerts-title"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <BellRingIcon className="size-5" aria-hidden />
          {t("title", { count: total })}
        </h2>
        <Link
          href={`${Routes.stock}?${ListQueryParams.stockAlert}=${StockAlertParam.any}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          {t("seeAll")}
          <ArrowRightIcon className="size-4" aria-hidden />
        </Link>
      </div>
      <ul className="mt-4 divide-y rounded-xl border bg-background">
        {(alerts.data?.items ?? []).map((row) => (
          <li
            key={row.item.id}
            className="relative flex items-center gap-3 p-3"
          >
            <ItemThumb imageUrl={row.item.imageUrl} />
            <div className="min-w-0 flex-1">
              <Link
                href={RecordRoutes.item(row.item.id)}
                className="truncate font-medium after:absolute after:inset-0"
              >
                {row.item.name}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {row.alerts
                  .map((alert) =>
                    t("where", {
                      warehouse: alert.warehouse.name,
                      quantity: quantityLabel(
                        row.item.baseUnit,
                        alert.quantity
                      ),
                    })
                  )
                  .join(" · ")}
              </p>
              {/* Un seul dépôt en alerte : sa jauge dit d'un coup d'œil l'écart au seuil. */}
              {row.alerts.length === 1 && (
                <StockGauge
                  quantity={row.alerts[0].quantity}
                  threshold={row.alerts[0].minQuantity}
                  state={row.alerts[0].state}
                  className="mt-2 max-w-56"
                />
              )}
            </div>
            <StockStateBadge state={row.state} />
          </li>
        ))}
      </ul>
    </section>
  )
}
