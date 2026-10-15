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
 * Période et dépôts d'un rapport, gardés dans l'adresse (un lien partagé ouvre le même rapport) ;
 * sans période, les 30 derniers jours.
 */
export function useReportSearch() {
  const list = useListParams()
  const { warehouseIds, from, to } = list.params
  const period = useMemo<Period>(() => {
    const fallback = presetPeriod(DEFAULT_PRESET)
    return { from: from ?? fallback.from, to: to ?? fallback.to }
  }, [from, to])
  const search = useMemo<ReportSearch>(
    () => ({ warehouseIds, from: period.from, to: period.to }),
    [warehouseIds, period]
  )
  return {
    search,
    period,
    warehouseIds,
    setPeriod: (next: Period) => list.setPeriod(next.from, next.to),
    setWarehouses: list.setWarehouses,
  }
}
