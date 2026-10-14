"use client"

import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { StockState } from "@/lib/api/stock"

/** « Stock bas » ou « Rupture » : rien quand le stock est au-dessus des seuils. */
export function StockStateBadge({ state }: { state: StockState }) {
  const t = useTranslations("stock.state")
  if (state === StockState.ok) return null
  return (
    <Badge variant={state === StockState.out ? "danger" : "warning"}>
      {t(state)}
    </Badge>
  )
}
