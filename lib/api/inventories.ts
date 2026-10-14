import type { ApiClient } from "./http"
import { isProblem, ProblemCode } from "./problem"
import { query, type Item, type Page } from "./stock"
import type { VoucherRef, WarehouseRef } from "./vouchers"

/** Routes des inventaires (stock-api, StockApi ; D32). */
export const InventoryPaths = {
  inventories: "/v1/inventories",
  inventory: (id: string) => `/v1/inventories/${id}`,
  lines: (id: string) => `/v1/inventories/${id}/lines`,
  counts: (id: string) => `/v1/inventories/${id}/counts`,
  close: (id: string) => `/v1/inventories/${id}/close`,
  cancel: (id: string) => `/v1/inventories/${id}/cancel`,
} as const

export const InventoryQueryParams = {
  warehouseId: "warehouseId",
  status: "status",
  search: "q",
  state: "state",
  page: "page",
  size: "size",
} as const

export const inventoryStatuses = ["OPEN", "CLOSED", "CANCELLED"] as const
export type InventoryStatus = (typeof inventoryStatuses)[number]
export const InventoryStatus = {
  open: "OPEN",
  closed: "CLOSED",
  cancelled: "CANCELLED",
} as const satisfies Record<string, InventoryStatus>

/** Filtre de la feuille de comptage (stock-api, SheetFilter). */
export const sheetFilters = ["TO_COUNT", "COUNTED", "GAPS"] as const
export type SheetFilter = (typeof sheetFilters)[number]
export const SheetFilter = {
  toCount: "TO_COUNT",
  counted: "COUNTED",
  gaps: "GAPS",
} as const satisfies Record<string, SheetFilter>

export type SheetProgress = { lines: number; counted: number; gaps: number }

export type Inventory = {
  id: string
  warehouse: WarehouseRef
  /** Inventaire tournant ; id null si la catégorie a été supprimée depuis. */
  category: { id: string | null; name: string } | null
  status: InventoryStatus
  startedByName: string
  startedAt: string
  endedByName: string | null
  endedAt: string | null
  /** Bon des écarts, à la clôture ; null s'il n'y en avait aucun. */
  adjustment: VoucherRef | null
  progress: SheetProgress
}

/** Un comptage, et le stock théorique de l'instant où il a été fait. */
export type Tally = {
  quantity: number
  book: number
  byName: string
  at: string
}

export type LineCount = {
  first: Tally
  /** Second comptage d'une ligne en écart : c'est lui qui est retenu. */
  recount: Tally | null
  retained: number
  /** Compté − théorique au moment du comptage retenu. */
  gap: number
}

export type SheetLine = {
  item: Item
  batch: string | null
  /** Stock actuel du lot dans le dépôt. */
  stock: number
  count: LineCount | null
}

export type CountInput = {
  itemId: string
  quantity: number
  /** Absent : quantité dans l'unité de base. */
  packagingName?: string
  batch?: string
  /** Second comptage d'une ligne en écart. */
  recount?: boolean
}

export type SheetSearch = { text?: string; filter?: SheetFilter }

/** Lignes à recompter quand la clôture est refusée (champ « lines » de l'erreur). */
export type MovedLine = { itemId: string; batch: string }
const LINES_FIELD = "lines"

export function movedLinesOf(error: unknown): MovedLine[] {
  if (!isProblem(error, ProblemCode.inventoryStockMoved)) return []
  const lines = error.body[LINES_FIELD]
  return Array.isArray(lines) ? (lines as MovedLine[]) : []
}

export const inventoryApi = (send: ApiClient) => {
  const scoped = { organizationScoped: true } as const
  return {
    inventories: (
      search: { warehouseIds?: string[]; status?: InventoryStatus },
      page: number,
      size: number
    ) =>
      send<Page<Inventory>>({
        ...scoped,
        method: "GET",
        path:
          InventoryPaths.inventories +
          query({
            [InventoryQueryParams.warehouseId]: search.warehouseIds,
            [InventoryQueryParams.status]: search.status,
            [InventoryQueryParams.page]: page,
            [InventoryQueryParams.size]: size,
          }),
      }),
    inventory: (id: string) =>
      send<Inventory>({
        ...scoped,
        method: "GET",
        path: InventoryPaths.inventory(id),
      }),
    lines: (id: string, search: SheetSearch, page: number, size: number) =>
      send<Page<SheetLine>>({
        ...scoped,
        method: "GET",
        path:
          InventoryPaths.lines(id) +
          query({
            [InventoryQueryParams.search]: search.text,
            [InventoryQueryParams.state]: search.filter,
            [InventoryQueryParams.page]: page,
            [InventoryQueryParams.size]: size,
          }),
      }),
    start: (id: string, warehouseId: string, categoryId?: string) =>
      send<Inventory>({
        ...scoped,
        method: "POST",
        path: InventoryPaths.inventories,
        body: { id, warehouseId, categoryId },
      }),
    count: (id: string, input: CountInput) =>
      send<SheetLine>({
        ...scoped,
        method: "PUT",
        path: InventoryPaths.counts(id),
        body: input,
      }),
    close: (id: string) =>
      send<Inventory>({
        ...scoped,
        method: "POST",
        path: InventoryPaths.close(id),
      }),
    cancel: (id: string) =>
      send<Inventory>({
        ...scoped,
        method: "POST",
        path: InventoryPaths.cancel(id),
      }),
  }
}
