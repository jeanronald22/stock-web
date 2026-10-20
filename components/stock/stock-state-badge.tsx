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

/**
 * État d'une ligne de tableau, toujours écrit : les alertes, sinon « En stock », ou « Épuisé » pour
 * un article sans seuil qui n'en a plus (rien ne le surveille, mais il manque).
 */
export function StockLevelBadge({
  state,
  quantity,
}: {
  state: StockState
  quantity: number
}) {
  const t = useTranslations("stock.state")
  if (state !== StockState.ok) return <StockStateBadge state={state} />
  return quantity > 0 ? (
    <Badge variant="success">{t("inStock")}</Badge>
  ) : (
    <Badge variant="secondary">{t("empty")}</Badge>
  )
}
