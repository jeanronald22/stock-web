"use client"

import { useFormatter, useTranslations } from "next-intl"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { DayActivity } from "@/lib/api/reports"
import { activitySeries } from "@/lib/reports/activity"
import { cn } from "@/lib/utils"

/** Au-delà, une barre par jour devient illisible : les étiquettes s'espacent. */
const LABELS_PER_AXIS = 8

/**
 * Bons d'entrée et de sortie jour par jour (D38) : on compte des bons, pas des quantités, qui ne
 * s'additionnent pas d'un article à l'autre.
 */
export function ActivityChart({
  activity,
  className,
}: {
  activity: DayActivity[]
  className?: string
}) {
  const t = useTranslations("reports.activity")
  const format = useFormatter()
  const data = activitySeries(activity)
  const config = {
    inbound: { label: t("inbound"), color: "var(--chart-2)" },
    outbound: { label: t("outbound"), color: "var(--chart-5)" },
  } satisfies ChartConfig
  const day = (value: string) =>
    format.dateTime(new Date(`${value}T12:00:00`), {
      day: "numeric",
      month: "short",
    })
  return (
    <ChartContainer
      config={config}
      className={cn("aspect-auto h-56 w-full", className)}
    >
      <BarChart data={data} barGap={2} margin={{ left: -16, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={Math.max(0, Math.ceil(data.length / LABELS_PER_AXIS) - 1)}
          tickFormatter={day}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => day(String(value))}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="inbound" fill="var(--color-inbound)" radius={3} />
        <Bar dataKey="outbound" fill="var(--color-outbound)" radius={3} />
      </BarChart>
    </ChartContainer>
  )
}
