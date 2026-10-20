"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { useActiveOrganization } from "@/lib/organization/active-organization"

import { useApi } from "./api-provider"
import type { ReportSearch } from "./reports"
import { stockKeys } from "./stock-queries"

/** Sous les clés du stock : tout bon enregistré les fait relire. */
export const reportKeys = {
  report: (
    organizationId: string | null,
    kind: ReportKind,
    search: ReportSearch
  ) => [...stockKeys.all(organizationId), "report", kind, search] as const,
  itemHistory: (
    organizationId: string | null,
    itemId: string,
    search: ReportSearch
  ) =>
    [
      ...stockKeys.all(organizationId),
      "report",
      "itemHistory",
      itemId,
      search,
    ] as const,
}

export const ReportKind = {
  movements: "movements",
  damage: "damage",
  discrepancies: "discrepancies",
  summary: "summary",
} as const
export type ReportKind = (typeof ReportKind)[keyof typeof ReportKind]

function useReport<K extends ReportKind>(kind: K, search: ReportSearch) {
  const { reports } = useApi()
  const organizationId = useActiveOrganization().activeOrganizationId
  return useQuery({
    queryKey: reportKeys.report(organizationId, kind, search),
    queryFn: () =>
      reports[kind](search) as Promise<
        Awaited<ReturnType<(typeof reports)[K]>>
      >,
    enabled: !!organizationId,
    // Relu à chaque ouverture : les bons des collègues n'invalident pas ce cache.
    staleTime: 0,
    // Une autre période garde l'ancien rapport à l'écran pendant le calcul.
    placeholderData: keepPreviousData,
  })
}

export const useMovementsReport = (search: ReportSearch) =>
  useReport(ReportKind.movements, search)
export const useDamageReport = (search: ReportSearch) =>
  useReport(ReportKind.damage, search)
export const useDiscrepancyReport = (search: ReportSearch) =>
  useReport(ReportKind.discrepancies, search)
export const useActivitySummary = (search: ReportSearch) =>
  useReport(ReportKind.summary, search)

/** Entrées et sorties d'un article jour par jour, pour sa fiche ; relues comme les rapports. */
export function useItemHistory(itemId: string, search: ReportSearch) {
  const { reports } = useApi()
  const organizationId = useActiveOrganization().activeOrganizationId
  return useQuery({
    queryKey: reportKeys.itemHistory(organizationId, itemId, search),
    queryFn: () => reports.itemHistory(itemId, search),
    enabled: !!organizationId,
    staleTime: 0,
    placeholderData: keepPreviousData,
  })
}
