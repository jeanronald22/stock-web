import type { ApiClient } from "./http"
import { isProblem, ProblemCode } from "./problem"
import {
  query,
  type BaseUnit,
  type Item,
  type Page,
  type StockState,
} from "./stock"

/** Routes des bons et du stock (stock-api, StockApi). */
export const VoucherPaths = {
  vouchers: "/v1/vouchers",
  voucher: (id: string) => `/v1/vouchers/${id}`,
  stock: "/v1/stock",
  itemStock: (itemId: string) => `/v1/stock/items/${itemId}`,
} as const

export const VoucherQueryParams = {
  type: "type",
  warehouseId: "warehouseId",
  supplierId: "supplierId",
  categoryId: "categoryId",
  stockState: "stockState",
  from: "from",
  to: "to",
  order: "order",
  search: "q",
  page: "page",
  size: "size",
} as const

/** Mêmes limites que l'API (stock-api, StockLimits). */
export const VoucherLimits = {
  batch: 60,
  counterparty: 120,
  documentReference: 60,
  note: 500,
  lines: 200,
} as const

export const voucherTypes = ["RECEIPT", "ISSUE"] as const
export type VoucherType = (typeof voucherTypes)[number]
export const VoucherType = {
  receipt: "RECEIPT",
  issue: "ISSUE",
} as const satisfies Record<string, VoucherType>

export type WarehouseRef = { id: string; name: string }

/** Ordre de la liste des bons, par date de l'opération (stock-api, VoucherOrder). */
export const voucherOrders = ["NEWEST_FIRST", "OLDEST_FIRST"] as const
export type VoucherOrder = (typeof voucherOrders)[number]
export const VoucherOrder = {
  newestFirst: "NEWEST_FIRST",
  oldestFirst: "OLDEST_FIRST",
} as const satisfies Record<string, VoucherOrder>

export type VoucherSummary = {
  id: string
  number: string
  type: VoucherType
  warehouse: WarehouseRef
  occurredAt: string
  supplierId: string | null
  counterparty: string | null
  lineCount: number
  createdByName: string
}

export type VoucherLine = {
  itemId: string
  itemName: string
  itemReference: string | null
  /** Lien signé vers la photo, relatif à l'API (voir useFileUrl) ; null sans photo. */
  itemImageUrl: string | null
  baseUnit: BaseUnit
  /** En unité de base. */
  quantity: number
  enteredQuantity: number
  packagingName: string | null
  batch: string | null
}

export type Voucher = Omit<VoucherSummary, "lineCount"> & {
  documentReference: string | null
  note: string | null
  lines: VoucherLine[]
  recordedAt: string
}

export type VoucherLineInput = {
  itemId: string
  quantity: number
  /** Absent : quantité dans l'unité de base. */
  packagingName?: string
  batch?: string
}

export type VoucherInput = {
  type: VoucherType
  warehouseId: string
  /** Réception : fournisseur de l'annuaire ; son nom remplace counterparty. */
  supplierId?: string
  occurredAt?: string
  counterparty?: string
  documentReference?: string
  note?: string
  lines: VoucherLineInput[]
}

/** Manque renvoyé par l'API quand une sortie dépasse le stock (champ « shortages »). */
export type Shortage = {
  itemId: string
  batch: string
  requested: number
  available: number
}

const SHORTAGES_FIELD = "shortages"

/** Manques d'une sortie refusée ; vide pour toute autre erreur. */
export function shortagesOf(error: unknown): Shortage[] {
  if (!isProblem(error, ProblemCode.insufficientStock)) return []
  const shortages = error.body[SHORTAGES_FIELD]
  return Array.isArray(shortages) ? (shortages as Shortage[]) : []
}

export type BatchQuantity = { batch: string | null; quantity: number }
/** Dépôt où l'article est au seuil ou en dessous, ou en rupture. */
export type StockAlert = {
  warehouse: WarehouseRef
  state: StockState
  quantity: number
  minQuantity: number
}
export type StockRow = {
  item: Item
  quantity: number
  batches: BatchQuantity[]
  /** La plus grave des alertes ; OK sans alerte. */
  state: StockState
  /** Dans les dépôts filtrés, rupture d'abord. */
  alerts: StockAlert[]
}
export type WarehouseStock = {
  warehouse: WarehouseRef
  quantity: number
  batches: BatchQuantity[]
}
export type ItemStock = { itemId: string; warehouses: WarehouseStock[] }

/** [from] et [to] : jours inclus (AAAA-MM-JJ), comptés dans le fuseau des dépôts par l'API. */
export type VoucherSearch = {
  type?: VoucherType
  warehouseIds?: string[]
  supplierId?: string
  from?: string
  to?: string
  order?: VoucherOrder
}
export type StockSearch = {
  text?: string
  warehouseIds?: string[]
  categoryId?: string
  stockStates?: StockState[]
}

export const voucherApi = (send: ApiClient) => {
  const scoped = { organizationScoped: true } as const
  return {
    vouchers: (search: VoucherSearch, page: number, size: number) =>
      send<Page<VoucherSummary>>({
        ...scoped,
        method: "GET",
        path:
          VoucherPaths.vouchers +
          query({
            [VoucherQueryParams.type]: search.type,
            [VoucherQueryParams.warehouseId]: search.warehouseIds,
            [VoucherQueryParams.supplierId]: search.supplierId,
            [VoucherQueryParams.from]: search.from,
            [VoucherQueryParams.to]: search.to,
            [VoucherQueryParams.order]: search.order,
            [VoucherQueryParams.page]: page,
            [VoucherQueryParams.size]: size,
          }),
      }),
    voucher: (id: string) =>
      send<Voucher>({
        ...scoped,
        method: "GET",
        path: VoucherPaths.voucher(id),
      }),
    record: (id: string, input: VoucherInput) =>
      send<Voucher>({
        ...scoped,
        method: "POST",
        path: VoucherPaths.vouchers,
        body: { id, ...input },
      }),
    stock: (search: StockSearch, page: number, size: number) =>
      send<Page<StockRow>>({
        ...scoped,
        method: "GET",
        path:
          VoucherPaths.stock +
          query({
            [VoucherQueryParams.search]: search.text,
            [VoucherQueryParams.warehouseId]: search.warehouseIds,
            [VoucherQueryParams.categoryId]: search.categoryId,
            [VoucherQueryParams.stockState]: search.stockStates,
            [VoucherQueryParams.page]: page,
            [VoucherQueryParams.size]: size,
          }),
      }),
    itemStock: (itemId: string) =>
      send<ItemStock>({
        ...scoped,
        method: "GET",
        path: VoucherPaths.itemStock(itemId),
      }),
  }
}
