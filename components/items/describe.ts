"use client"

import { useFormatter, useTranslations } from "next-intl"
import { useCallback } from "react"

import type { BaseUnit } from "@/lib/api/stock"

/** « 12 pièces », « 1,44 m² » : une quantité dans l'unité de base de l'article. */
export function useQuantityLabel() {
  const t = useTranslations("units")
  return useCallback(
    (unit: BaseUnit, count: number) => t(`${unit}.quantity`, { count }),
    [t]
  )
}

/**
 * Caractéristiques d'un lot, quand on les connaît : nuance et calibre (D35), date limite AAAA-MM-JJ
 * (D44).
 */
export type BatchTraits = {
  shade?: string | null
  caliber?: string | null
  expiresOn?: string | null
}

/** « 12 nov. 2026 » : un jour AAAA-MM-JJ, lu à midi pour qu'aucun fuseau ne le décale. */
export function useDayLabel() {
  const format = useFormatter()
  return useCallback(
    (day: string) =>
      format.dateTime(new Date(`${day}T12:00:00`), { dateStyle: "medium" }),
    [format]
  )
}

/**
 * « L2409 · nuance B2 · cal. 9 · périme le 12 nov. 2026 » : le lot, ce qui le distingue à l'œil
 * (D35) et sa date limite (D44).
 */
export function useBatchLabel() {
  const t = useTranslations("batches")
  const dayLabel = useDayLabel()
  return useCallback(
    (batch: string, traits?: BatchTraits) =>
      [
        batch,
        traits?.shade && t("shade", { shade: traits.shade }),
        traits?.caliber && t("caliber", { caliber: traits.caliber }),
        traits?.expiresOn &&
          t("expiresOn", { date: dayLabel(traits.expiresOn) }),
      ]
        .filter(Boolean)
        .join(" · "),
    [t, dayLabel]
  )
}

/**
 * « 30 × Carton + 2 pièces » : un stock lu dans le plus grand conditionnement de l'article, comme on
 * le compte au dépôt (D10 : cartons entamés suivis à la pièce près). null sans conditionnement.
 */
export function usePackagingBreakdown() {
  const t = useTranslations("units")
  return useCallback(
    (
      item: {
        baseUnit: BaseUnit
        packagings: { name: string; quantity: number }[]
      },
      quantity: number
    ): string | null => {
      const largest = [...item.packagings].sort(
        (a, b) => b.quantity - a.quantity
      )[0]
      if (!largest || quantity < largest.quantity) return null
      const full = Math.floor(quantity / largest.quantity)
      // Arrondi à 4 décimales, comme l'API : 3 m² − 2 × 1,44 ne doit pas donner 0,1199999.
      const rest =
        Math.round((quantity - full * largest.quantity) * 10_000) / 10_000
      const packs = `${full} × ${largest.name}`
      return rest > 0
        ? `${packs} + ${t(`${item.baseUnit}.quantity`, { count: rest })}`
        : packs
    },
    [t]
  )
}
