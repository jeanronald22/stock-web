"use client"

import { useTranslations } from "next-intl"
import { useCallback } from "react"

import type { BaseUnit, Packaging } from "@/lib/api/stock"

/** « 12 pièces », « 1,44 m² » : une quantité dans l'unité de base de l'article. */
export function useQuantityLabel() {
  const t = useTranslations("units")
  return useCallback(
    (unit: BaseUnit, count: number) => t(`${unit}.quantity`, { count }),
    [t]
  )
}

/** « Carton de 12 pièces » pour la liste ; vide si l'article n'a pas de conditionnement. */
export function usePackagingSummary() {
  const quantity = useQuantityLabel()
  return useCallback(
    (unit: BaseUnit, packagings: Packaging[]) =>
      packagings
        .map(
          (packaging) =>
            `${packaging.name} · ${quantity(unit, packaging.quantity)}`
        )
        .join("  ·  "),
    [quantity]
  )
}
