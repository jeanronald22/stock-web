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
import {
  ActivityStep,
  activitySeries,
  activityStep,
} from "@/lib/reports/activity"
import { cn } from "@/lib/utils"

/**
 * Bons d'entrée et de sortie (D38), par jour, par semaine ou par mois selon la longueur de la
 * période : on compte des bons, pas des quantités, qui ne s'additionnent pas d'un article à l'autre.
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
  const step = activityStep(activity.length)
  const data = activitySeries(activity, step)
  const config = {
    inbound: { label: t("inbound"), color: "var(--chart-2)" },
    outbound: { label: t("outbound"), color: "var(--chart-5)" },
  } satisfies ChartConfig
  // Midi : un changement d'heure ne fait jamais glisser le jour.
  const date = (value: string) => new Date(`${value}T12:00:00`)
  const tick = (value: string) =>
    step === ActivityStep.month
      ? format.dateTime(date(value), { month: "short" })
      : format.dateTime(date(value), { day: "numeric", month: "short" })
  const label = (value: string) =>
    step === ActivityStep.month
      ? format.dateTime(date(value), { month: "long", year: "numeric" })
      : step === ActivityStep.week
        ? t("weekOf", { day: tick(value) })
        : tick(value)
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
          // Recharts n'écrit que les dates qui tiennent : moins sur téléphone.
          minTickGap={24}
          interval="preserveStartEnd"
          tickFormatter={tick}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => label(String(value))}
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
