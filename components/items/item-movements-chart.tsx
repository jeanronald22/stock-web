"use client"

import { useFormatter, useTranslations } from "next-intl"
import { useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { DateRangePicker } from "@/components/catalog/date-range-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { useItemHistory } from "@/lib/api/report-queries"
import type { BaseUnit } from "@/lib/api/stock"
import { useErrorMessage } from "@/lib/api/use-error-message"
import {
  DEFAULT_PRESET,
  presetPeriod,
  type Period,
} from "@/lib/reports/periods"
import { cn } from "@/lib/utils"

import { useQuantityLabel } from "./describe"

/** Midi : un changement d'heure ne fait jamais glisser le jour. */
function dayDate(day: string): Date {
  return new Date(`${day}T12:00:00`)
}

/**
 * Entrées et sorties de l'article jour par jour, en quantités, dans les dépôts de la personne :
 * d'un coup d'œil, quand il arrive et à quel rythme il part.
 */
export function ItemMovementsChart({
  itemId,
  baseUnit,
}: {
  itemId: string
  baseUnit: BaseUnit
}) {
  const t = useTranslations("items.detail")
  const format = useFormatter()
  const quantityLabel = useQuantityLabel()
  const errorMessage = useErrorMessage()
  const [period, setPeriod] = useState<Period>(() =>
    presetPeriod(DEFAULT_PRESET)
  )
  const history = useItemHistory(itemId, period)
  const days = history.data?.days ?? []

  const config = {
    inbound: { label: t("inbound"), color: "var(--chart-2)" },
    outbound: { label: t("outbound"), color: "var(--chart-5)" },
  } satisfies ChartConfig
  const day = (value: string) =>
    format.dateTime(dayDate(value), { day: "numeric", month: "short" })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">{t("movementsChart")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("movementsChartHint")}
          </p>
        </div>
        <DateRangePicker
          from={period.from}
          to={period.to}
          onChange={(from, to) => from && to && setPeriod({ from, to })}
          label={t("periodLabel")}
          className="h-11 w-full sm:h-9 sm:w-64"
        />
      </div>
      {history.isError ? (
        // Une période de plus d'un an est refusée par l'API : son message le dit.
        <p
          role="alert"
          className="mt-4 flex h-60 items-center justify-center rounded-xl bg-muted/40 px-6 text-center text-sm text-muted-foreground"
        >
          {errorMessage(history.error)}
        </p>
      ) : history.isPending ? (
        <Skeleton className="mt-4 h-60 rounded-xl" />
      ) : (
        <ChartContainer
          config={config}
          className={cn(
            "mt-4 aspect-auto h-60 w-full transition-opacity",
            history.isPlaceholderData && "opacity-60"
          )}
          role="img"
          aria-label={t("movementsChartSummary", {
            inbound: quantityLabel(
              baseUnit,
              days.reduce((sum, entry) => sum + entry.inbound, 0)
            ),
            outbound: quantityLabel(
              baseUnit,
              days.reduce((sum, entry) => sum + entry.outbound, 0)
            ),
          })}
        >
          <AreaChart data={days} margin={{ left: -8, right: 8, top: 8 }}>
            <defs>
              {(["inbound", "outbound"] as const).map((key) => (
                <linearGradient
                  key={key}
                  id={`item-${key}-fill`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={`var(--color-${key})`}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={`var(--color-${key})`}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              // Recharts n'écrit que les dates qui tiennent : moins sur téléphone.
              minTickGap={24}
              interval="preserveStartEnd"
              tickFormatter={day}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(value: number) => format.number(value)}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border)" }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(value) =>
                    format.dateTime(dayDate(String(value)), {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                    })
                  }
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {config[name as keyof typeof config]?.label}
                      </span>
                      <span className="num font-medium text-foreground">
                        {quantityLabel(baseUnit, Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="inbound"
              type="monotone"
              stroke="var(--color-inbound)"
              strokeWidth={2}
              fill="url(#item-inbound-fill)"
            />
            <Area
              dataKey="outbound"
              type="monotone"
              stroke="var(--color-outbound)"
              strokeWidth={2}
              fill="url(#item-outbound-fill)"
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  )
}
