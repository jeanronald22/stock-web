import type { ApiClient } from "./http"
import { query, type BaseUnit } from "./stock"
import type { VoucherReason, VoucherType } from "./vouchers"

/** Routes des rapports (stock-api, StockApi ; D38). */
export const ReportPaths = {
  movements: "/v1/reports/movements",
  damage: "/v1/reports/damage",
  discrepancies: "/v1/reports/discrepancies",
  summary: "/v1/reports/summary",
  itemHistory: (itemId: string) => `/v1/reports/items/${itemId}/history`,
} as const

export const ReportQueryParams = {
  warehouseId: "warehouseId",
  from: "from",
  to: "to",
} as const

/** Période et dépôts ; dates AAAA-MM-JJ comprises ; sans dates, les 30 derniers jours. */
export type ReportSearch = {
  warehouseIds?: string[]
  from?: string
  to?: string
}

export type ReportPeriod = { from: string; to: string }

/** Article cité par un rapport ; ses quantités sont dans son unité de base. */
export type ReportItem = {
  id: string
  name: string
  reference: string | null
  baseUnit: BaseUnit
}

export type DayActivity = {
  day: string
  counts: Partial<Record<VoucherType, number>>
}

/** Mouvements d'un article : valeurs positives ; [adjusted] signé ; [net] = variation du stock. */
export type ItemMovements = {
  item: ReportItem
  received: number
  issued: number
  transferredIn: number
  transferredOut: number
  returnedByCustomers: number
  returnedToSuppliers: number
  damaged: number
  adjusted: number
  net: number
}

export type MovementsReport = {
  period: ReportPeriod
  totals: Partial<Record<VoucherType, number>>
  activity: DayActivity[]
  items: ItemMovements[]
}

export type DamageByReason = {
  reason: VoucherReason
  vouchers: number
  lines: number
}

export type DamageReport = {
  period: ReportPeriod
  vouchers: number
  byReason: DamageByReason[]
  items: { item: ReportItem; quantity: number; vouchers: number }[]
}

export type DiscrepancyReport = {
  period: ReportPeriod
  /** supplierId null : réceptions sans fournisseur de l'annuaire. */
  suppliers: {
    supplierId: string | null
    name: string | null
    receipts: number
    withDiscrepancy: number
  }[]
  receiptGaps: {
    voucherId: string
    number: string
    occurredAt: string
    supplierName: string | null
    item: ReportItem
    expected: number
    received: number
  }[]
  inventoryGaps: { item: ReportItem; gap: number; inventories: number }[]
}

export type ActivitySummary = {
  period: ReportPeriod
  totals: Partial<Record<VoucherType, number>>
  activity: DayActivity[]
  topIssued: ItemMovements[]
  damageByReason: DamageByReason[]
  damageVouchers: number
  receiptsWithDiscrepancy: number
}

/** Un jour d'un article : entrées et sorties en positif, stock du soir. */
export type ItemDay = {
  day: string
  inbound: number
  outbound: number
  balance: number
}

export type ItemHistory = {
  itemId: string
  period: ReportPeriod
  days: ItemDay[]
}

export const reportApi = (send: ApiClient) => {
  const scoped = { organizationScoped: true } as const
  const get =
    <T>(path: string) =>
    (search: ReportSearch) =>
      send<T>({
        ...scoped,
        method: "GET",
        path:
          path +
          query({
            [ReportQueryParams.warehouseId]: search.warehouseIds,
            [ReportQueryParams.from]: search.from,
            [ReportQueryParams.to]: search.to,
          }),
      })
  return {
    movements: get<MovementsReport>(ReportPaths.movements),
    damage: get<DamageReport>(ReportPaths.damage),
    discrepancies: get<DiscrepancyReport>(ReportPaths.discrepancies),
    summary: get<ActivitySummary>(ReportPaths.summary),
    itemHistory: (itemId: string, search: ReportSearch) =>
      get<ItemHistory>(ReportPaths.itemHistory(itemId))(search),
  }
}
