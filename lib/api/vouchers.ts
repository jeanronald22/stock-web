import type { ApiClient } from "./http"
import { isProblem, ProblemCode } from "./problem"
import type { BaseUnit, Item, Page } from "./stock"

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

export type VoucherSummary = {
  id: string
  number: string
  type: VoucherType
  warehouse: WarehouseRef
  occurredAt: string
  counterparty: string | null
  lineCount: number
  createdByName: string
}

export type VoucherLine = {
  itemId: string
  itemName: string
  itemReference: string | null
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
export type StockRow = {
  item: Item
  quantity: number
  batches: BatchQuantity[]
}
export type WarehouseStock = {
  warehouse: WarehouseRef
  quantity: number
  batches: BatchQuantity[]
}
export type ItemStock = { itemId: string; warehouses: WarehouseStock[] }

export type VoucherSearch = { type?: VoucherType; warehouseId?: string }
export type StockSearch = { text?: string; warehouseId?: string }

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value))
  })
  const text = search.toString()
  return text ? `?${text}` : ""
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
            [VoucherQueryParams.warehouseId]: search.warehouseId,
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
            [VoucherQueryParams.warehouseId]: search.warehouseId,
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
