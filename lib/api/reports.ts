import type { ApiClient } from "./http"
import { query, type BaseUnit } from "./stock"
import type { VoucherReason, VoucherType } from "./vouchers"

/** Routes des rapports (stock-api, StockApi ; D38). */
export const ReportPaths = {
  movements: "/v1/reports/movements",
  damage: "/v1/reports/damage",
  discrepancies: "/v1/reports/discrepancies",
  summary: "/v1/reports/summary",
  /** Tableau de bord du gérant (D43). */
  analysis: "/v1/reports/analysis",
  itemHistory: (itemId: string) => `/v1/reports/items/${itemId}/history`,
} as const

export const ReportQueryParams = {
  warehouseId: "warehouseId",
  itemId: "itemId",
  from: "from",
  to: "to",
} as const

/**
 * Période, dépôts et articles ; dates AAAA-MM-JJ comprises ; sans dates, les 30 derniers jours. Un
 * filtre par article ne garde que ses lignes, et les bons qui le portent.
 */
export type ReportSearch = {
  warehouseIds?: string[]
  itemIds?: string[]
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

/**
 * État du stock aujourd'hui (articles actifs, dépôts actifs) : proposés, en alerte (au seuil ou en
 * rupture dans un dépôt au moins), en rupture, et qui dorment (en stock, sans sortie sur la période).
 */
export type StockHealth = {
  items: number
  alerts: number
  out: number
  dormant: number
}

/** Bons d'un dépôt sur la période ; placements au seuil ou en rupture aujourd'hui. */
export type WarehouseActivity = {
  warehouseId: string
  name: string
  inbound: number
  outbound: number
  damage: number
  alerts: number
  out: number
}

export type IssuedItem = { item: ReportItem; issued: number; vouchers: number }

/** Au rythme des sorties de la période, le stock d'aujourd'hui tient [days] jours (0 : en rupture). */
export type ItemCoverage = {
  item: ReportItem
  stock: number
  dailyIssued: number
  days: number
}

/** En stock, pas sorti de la période ; lastIssuedAt null : jamais sorti. */
export type DormantItem = {
  item: ReportItem
  stock: number
  lastIssuedAt: string | null
}

/** customerId null : sorties sans client de l'annuaire. */
export type CustomerIssues = {
  customerId: string | null
  name: string | null
  vouchers: number
}

export type MemberActivity = {
  userId: string
  name: string
  vouchers: number
  inbound: number
  outbound: number
  corrections: number
}

export type ActivityAnalysis = {
  period: ReportPeriod
  previousPeriod: ReportPeriod
  totals: Partial<Record<VoucherType, number>>
  previousTotals: Partial<Record<VoucherType, number>>
  activity: DayActivity[]
  receiptsWithDiscrepancy: number
  previousReceiptsWithDiscrepancy: number
  stock: StockHealth
  warehouses: WarehouseActivity[]
  topIssued: IssuedItem[]
  runningOut: ItemCoverage[]
  dormant: DormantItem[]
  damageByReason: DamageByReason[]
  suppliers: DiscrepancyReport["suppliers"]
  customers: CustomerIssues[]
  team: MemberActivity[]
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
            [ReportQueryParams.itemId]: search.itemIds,
            [ReportQueryParams.from]: search.from,
            [ReportQueryParams.to]: search.to,
          }),
      })
  return {
    movements: get<MovementsReport>(ReportPaths.movements),
    damage: get<DamageReport>(ReportPaths.damage),
    discrepancies: get<DiscrepancyReport>(ReportPaths.discrepancies),
    summary: get<ActivitySummary>(ReportPaths.summary),
    analysis: get<ActivityAnalysis>(ReportPaths.analysis),
    itemHistory: (itemId: string, search: ReportSearch) =>
      get<ItemHistory>(ReportPaths.itemHistory(itemId))(search),
  }
}
