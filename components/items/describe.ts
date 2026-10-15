"use client"

import { useTranslations } from "next-intl"
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

/** Caractéristiques d'un lot (D35) : nuance et calibre, quand on les connaît. */
export type BatchTraits = { shade?: string | null; caliber?: string | null }

/** « L2409 · nuance B2 · cal. 9 » : le lot et ce qui le distingue à l'œil (D35). */
export function useBatchLabel() {
  const t = useTranslations("batches")
  return useCallback(
    (batch: string, traits?: BatchTraits) =>
      [
        batch,
        traits?.shade && t("shade", { shade: traits.shade }),
        traits?.caliber && t("caliber", { caliber: traits.caliber }),
      ]
        .filter(Boolean)
        .join(" · "),
    [t]
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
