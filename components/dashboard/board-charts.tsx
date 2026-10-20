"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Cell, Pie, PieChart } from "recharts"

import {
  BoardCard,
  RankedRow,
  ReportEmpty,
} from "@/components/reports/report-parts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { ActivityAnalysis, StockHealth } from "@/lib/api/reports"
import { VoucherType } from "@/lib/api/vouchers"
import { ListQueryParams, Routes, StockAlertParam } from "@/lib/routes"
import { cn } from "@/lib/utils"

/** Part en pourcentage entier ; 0 sans total. */
const percent = (part: number, total: number) =>
  total === 0 ? 0 : Math.round((part / total) * 100)

/** États d'un article dans le donut : chacun a sa couleur d'état, jamais une couleur de série. */
const StockState = { ok: "ok", low: "low", out: "out" } as const
type StockState = (typeof StockState)[keyof typeof StockState]

const STATE_COLORS: Record<StockState, string> = {
  [StockState.ok]: "var(--success)",
  [StockState.low]: "var(--warning)",
  [StockState.out]: "var(--destructive)",
}

/** Liste du stock filtrée sur un état ; « suffisant » n'a pas de filtre, la liste entière. */
const STATE_ALERTS: Record<StockState, StockAlertParam | null> = {
  [StockState.ok]: null,
  [StockState.low]: StockAlertParam.low,
  [StockState.out]: StockAlertParam.out,
}

/**
 * Les articles suivis aujourd'hui, par état : stock suffisant, à commander (au seuil), en rupture.
 * Un article en alerte dans un dépôt au moins compte en alerte. Chaque ligne ouvre le stock filtré.
 */
export function StockStateCard({
  stock,
  warehouseQuery,
}: {
  stock: StockHealth
  /** Dépôts choisis, repris par la liste du stock. */
  warehouseQuery: string
}) {
  const t = useTranslations("dashboard.board.stockState")
  const counts: Record<StockState, number> = {
    [StockState.ok]: stock.items - stock.alerts,
    [StockState.low]: stock.alerts - stock.out,
    [StockState.out]: stock.out,
  }
  const states = Object.values(StockState)
  const data = states
    .filter((state) => counts[state] > 0)
    .map((state) => ({ state, count: counts[state] }))
  const config = Object.fromEntries(
    states.map((state) => [
      state,
      { label: t(state), color: STATE_COLORS[state] },
    ])
  ) satisfies ChartConfig
  const href = (state: StockState) => {
    const alert = STATE_ALERTS[state]
    const query = [
      warehouseQuery,
      alert && `${ListQueryParams.stockAlert}=${alert}`,
    ]
      .filter(Boolean)
      .join("&")
    return query ? `${Routes.stock}?${query}` : Routes.stock
  }

  return (
    <BoardCard
      title={t("title")}
      description={t("description")}
      link={{ href: href(StockState.ok), label: t("seeAll") }}
    >
      {stock.items === 0 ? (
        <ReportEmpty>{t("empty")}</ReportEmpty>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col">
          <div className="relative size-40 shrink-0">
            <ChartContainer config={config} className="aspect-square size-40">
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="state" hideLabel />}
                />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="state"
                  innerRadius={54}
                  outerRadius={78}
                  paddingAngle={data.length > 1 ? 2 : 0}
                  cornerRadius={4}
                  stroke="var(--background)"
                  strokeWidth={data.length > 1 ? 2 : 0}
                  isAnimationActive={false}
                >
                  {data.map((entry) => (
                    <Cell key={entry.state} fill={STATE_COLORS[entry.state]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="num text-3xl font-semibold">{stock.items}</span>
              <span className="text-xs text-muted-foreground">
                {t("center", { count: stock.items })}
              </span>
            </div>
          </div>
          <ul className="w-full min-w-0 space-y-1">
            {states.map((state) => (
              <li key={state}>
                <Link
                  href={href(state)}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: STATE_COLORS[state] }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate">{t(state)}</span>
                  <span className="num font-semibold">{counts[state]}</span>
                  <span className="w-10 text-right num text-xs text-muted-foreground">
                    {t("share", {
                      share: percent(counts[state], stock.items),
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </BoardCard>
  )
}

const RING_RADIUS = 40
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/**
 * Part des réceptions conformes au bon de livraison sur la période (D28), en jauge : ce que le
 * contrôleur et le gérant surveillent chez leurs fournisseurs.
 */
export function ReceiptConformityCard({
  analysis,
  query,
}: {
  analysis: ActivityAnalysis
  query: string
}) {
  const t = useTranslations("dashboard.board.conformity")
  const receipts = analysis.totals[VoucherType.receipt] ?? 0
  const gaps = analysis.receiptsWithDiscrepancy
  const conform = receipts - gaps
  const share = percent(conform, receipts)
  return (
    <BoardCard
      title={t("title")}
      description={t("description")}
      link={{
        href: `${Routes.reportsDiscrepancies}?${query}`,
        label: t("details"),
      }}
    >
      {receipts === 0 ? (
        <ReportEmpty>{t("empty")}</ReportEmpty>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative size-40"
            role="img"
            aria-label={t("value", { share })}
          >
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="9"
                className="stroke-muted"
              />
              <circle
                cx="50"
                cy="50"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - share / 100)}
                className={cn(
                  "transition-[stroke-dashoffset] duration-700",
                  gaps === 0 ? "stroke-primary" : "stroke-warning"
                )}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center num text-3xl font-semibold">
              {t("value", { share })}
            </span>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {t("detail", { conform, count: receipts })}
          </p>
        </div>
      )}
    </BoardCard>
  )
}

/** Ordre de lecture des types de bons : ce qui entre, ce qui sort, puis les corrections. */
const VOUCHER_ORDER: readonly VoucherType[] = [
  VoucherType.receipt,
  VoucherType.customerReturn,
  VoucherType.transferIn,
  VoucherType.issue,
  VoucherType.supplierReturn,
  VoucherType.transferOut,
  VoucherType.damage,
  VoucherType.adjustment,
]

/** Les bons de la période, type par type, le plus fréquent en tête. */
export function VoucherTypesCard({
  analysis,
  query,
  className,
}: {
  analysis: ActivityAnalysis
  query: string
  className?: string
}) {
  const t = useTranslations("dashboard.board.vouchers")
  const tTypes = useTranslations("vouchers.types")
  const rows = VOUCHER_ORDER.map((type) => ({
    type,
    count: analysis.totals[type] ?? 0,
  }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count)
  const total = rows.reduce((sum, row) => sum + row.count, 0)
  const max = Math.max(1, ...rows.map((row) => row.count))
  return (
    <BoardCard
      title={t("title")}
      description={t("description", { count: total })}
      link={{ href: `${Routes.reports}?${query}`, label: t("seeAll") }}
      className={className}
    >
      {rows.length === 0 ? (
        <ReportEmpty>{t("empty")}</ReportEmpty>
      ) : (
        <ol className="space-y-3">
          {rows.map((row) => (
            <RankedRow
              key={row.type}
              label={tTypes(row.type)}
              value={row.count}
              share={row.count / max}
            />
          ))}
        </ol>
      )}
    </BoardCard>
  )
}
