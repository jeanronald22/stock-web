"use client"

import { useFormatter, useTranslations } from "next-intl"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { StockState, type BaseUnit } from "@/lib/api/stock"
import { cn } from "@/lib/utils"

import { useQuantityLabel } from "./describe"

/** Au-delà, le nom d'un dépôt sous sa colonne est coupé. */
const NAME_MAX = 14

/** La barre du stock prend la couleur de son état, écrit en toutes lettres dans la liste. */
const STATE_FILLS: Record<StockState, string> = {
  [StockState.ok]: "var(--chart-2)",
  [StockState.low]: "var(--warning)",
  [StockState.out]: "var(--destructive)",
}

export type WarehouseBar = {
  name: string
  quantity: number
  /** null : pas de seuil, pas de seconde barre. */
  minQuantity: number | null
  state: StockState
}

/**
 * Stock de chaque dépôt à côté de son seuil d'alerte : où il en reste, où il en manque. Montré à
 * colonnes verticales, une par dépôt ; la couleur dit l'état, écrit aussi dans la bulle.
 */
export function ItemWarehouseChart({
  bars,
  baseUnit,
}: {
  bars: WarehouseBar[]
  baseUnit: BaseUnit
}) {
  const t = useTranslations("items.detail")
  const format = useFormatter()
  const tState = useTranslations("stock.state")
  const quantityLabel = useQuantityLabel()
  const stateLabel = (bar: WarehouseBar) =>
    bar.state === StockState.ok
      ? tState(bar.quantity > 0 ? "inStock" : "empty")
      : tState(bar.state)
  const watched = bars.some((bar) => bar.minQuantity !== null)
  const config = {
    quantity: { label: t("stockSeries"), color: "var(--chart-2)" },
    minQuantity: {
      label: t("thresholdSeries"),
      color: "var(--muted-foreground)",
    },
  } satisfies ChartConfig

  // Légende des états présents seulement : la couleur d'une colonne est celle de son état.
  const states = [StockState.ok, StockState.low, StockState.out].filter(
    (state) => bars.some((bar) => bar.state === state)
  )
  return (
    <div>
      <ChartContainer
        config={config}
        className="aspect-auto h-64 w-full"
        role="img"
        aria-label={t("warehouseChart")}
      >
        <BarChart data={bars} barGap={4} margin={{ left: -8, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            tickFormatter={(value: string) =>
              value.length > NAME_MAX
                ? `${value.slice(0, NAME_MAX - 1)}…`
                : value
            }
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(value: number) => format.number(value)}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            content={
              <ChartTooltipContent
                labelFormatter={(label, payload) => {
                  const bar = payload[0]?.payload as WarehouseBar | undefined
                  return bar ? `${label} · ${stateLabel(bar)}` : label
                }}
                formatter={(value, name, item) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span
                        className="size-2.5 rounded-[2px]"
                        style={{
                          background:
                            name === "quantity"
                              ? STATE_FILLS[
                                  (item.payload as WarehouseBar).state
                                ]
                              : "var(--color-minQuantity)",
                        }}
                      />
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
          <Bar
            dataKey="quantity"
            fill="var(--color-quantity)"
            radius={4}
            barSize={32}
          >
            {bars.map((bar) => (
              <Cell key={bar.name} fill={STATE_FILLS[bar.state]} />
            ))}
          </Bar>
          {watched && (
            <Bar
              dataKey="minQuantity"
              fill="var(--color-minQuantity)"
              fillOpacity={0.35}
              radius={4}
              barSize={32}
            />
          )}
        </BarChart>
      </ChartContainer>
      <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
        {states.map((state) => (
          <LegendItem
            key={state}
            color={STATE_FILLS[state]}
            label={state === StockState.ok ? tState("inStock") : tState(state)}
          />
        ))}
        {watched && (
          <LegendItem
            color="var(--muted-foreground)"
            faded
            label={t("thresholdSeries")}
          />
        )}
      </ul>
    </div>
  )
}

function LegendItem({
  color,
  label,
  faded = false,
}: {
  color: string
  label: string
  faded?: boolean
}) {
  return (
    <li className="flex items-center gap-1.5">
      <span
        className={cn("size-2.5 rounded-[2px]", faded && "opacity-35")}
        style={{ background: color }}
        aria-hidden
      />
      {label}
    </li>
  )
}
