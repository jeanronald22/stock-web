"use client"

import { useMemo } from "react"

import type { ReportSearch } from "@/lib/api/reports"
import { useListParams } from "@/lib/list/use-list-params"
import {
  DEFAULT_PRESET,
  presetPeriod,
  type Period,
} from "@/lib/reports/periods"

/**
 * Période, dépôts et article du tableau de bord et des rapports, gardés dans l'adresse (un lien partagé ouvre la même
 * vue, et les onglets la gardent) ; sans période, les 30 derniers jours.
 */
export function useReportSearch() {
  const list = useListParams()
  const { warehouseIds, itemId, from, to } = list.params
  const period = useMemo<Period>(() => {
    const fallback = presetPeriod(DEFAULT_PRESET)
    return { from: from ?? fallback.from, to: to ?? fallback.to }
  }, [from, to])
  const search = useMemo<ReportSearch>(
    () => ({
      warehouseIds,
      itemIds: itemId ? [itemId] : undefined,
      from: period.from,
      to: period.to,
    }),
    [warehouseIds, itemId, period]
  )
  return {
    search,
    period,
    warehouseIds,
    itemId,
    setPeriod: (next: Period) => list.setPeriod(next.from, next.to),
    setWarehouses: list.setWarehouses,
    setItem: list.setItem,
  }
}
