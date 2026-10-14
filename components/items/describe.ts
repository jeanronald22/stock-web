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
