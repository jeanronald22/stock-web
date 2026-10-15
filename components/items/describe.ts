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
