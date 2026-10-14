import type { ApiClient } from "./http"

/** Routes du module Stock de l'API (stock-api, StockApi). */
export const StockPaths = {
  warehouses: "/v1/warehouses",
  warehouse: (id: string) => `/v1/warehouses/${id}`,
  warehouseArchive: (id: string) => `/v1/warehouses/${id}/archive`,
  warehouseRestore: (id: string) => `/v1/warehouses/${id}/restore`,
  items: "/v1/items",
  item: (id: string) => `/v1/items/${id}`,
  itemArchive: (id: string) => `/v1/items/${id}/archive`,
  itemRestore: (id: string) => `/v1/items/${id}/restore`,
  itemImage: (id: string) => `/v1/items/${id}/image`,
} as const

/** Paramètres de recherche des listes (stock-api, StockApi et PageParams). */
export const StockQueryParams = {
  search: "q",
  status: "status",
  warehouseId: "warehouseId",
  page: "page",
  size: "size",
} as const

/** Mêmes limites que l'API (stock-api, StockLimits), pour signaler l'erreur avant l'envoi. */
export const StockLimits = {
  name: 120,
  reference: 40,
  city: 80,
  address: 200,
  description: 500,
  packagingName: 40,
  packagingsPerItem: 10,
  pageSize: 50,
} as const

export const catalogStatuses = ["ACTIVE", "ARCHIVED"] as const
export type CatalogStatus = (typeof catalogStatuses)[number]
export const CatalogStatus = {
  active: "ACTIVE",
  archived: "ARCHIVED",
} as const satisfies Record<string, CatalogStatus>

export const warehouseKinds = ["SHOP", "WAREHOUSE", "SITE"] as const
export type WarehouseKind = (typeof warehouseKinds)[number]

/** Unités de base ; PIECE se conditionne par nombres entiers (stock-api, BaseUnit). */
export const baseUnits = [
  "PIECE",
  "KILOGRAM",
  "LITRE",
  "METRE",
  "SQUARE_METRE",
  "CUBIC_METRE",
] as const
export type BaseUnit = (typeof baseUnits)[number]
export const wholeQuantityUnits: ReadonlySet<BaseUnit> = new Set(["PIECE"])

export type Warehouse = {
  id: string
  name: string
  kind: WarehouseKind
  city: string | null
  address: string | null
  status: CatalogStatus
  itemCount: number
  version: number
  createdAt: string
  updatedAt: string
}

export type WarehouseInput = {
  name: string
  kind: WarehouseKind
  city?: string
  address?: string
}

export type Packaging = { name: string; quantity: number }

export type Item = {
  id: string
  name: string
  reference: string | null
  baseUnit: BaseUnit
  batchTracking: boolean
  description: string | null
  packagings: Packaging[]
  warehouseIds: string[]
  status: CatalogStatus
  version: number
  createdAt: string
  updatedAt: string
  /** Lien signé vers la photo, relatif à l'API (voir useFileUrl) ; null sans photo. */
  imageUrl: string | null
}

export type ItemInput = {
  name: string
  reference?: string
  baseUnit: BaseUnit
  batchTracking: boolean
  description?: string
  packagings: Packaging[]
  warehouseIds: string[]
}

export type ItemSearch = {
  text?: string
  warehouseId?: string
  status?: CatalogStatus
}

/** Photos acceptées par l'API (stock-api, ImageFormat et ItemImageService). */
export const ItemImageRules = {
  types: ["image/jpeg", "image/png", "image/webp"],
  maxBytes: 5 * 1024 * 1024,
  /** Nom de la partie du formulaire multipart (stock-api, StockApi.IMAGE_PART). */
  part: "file",
} as const

export type Page<T> = { items: T[]; page: number; size: number; total: number }

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value))
  })
  const text = search.toString()
  return text ? `?${text}` : ""
}

/** Toutes les routes du stock concernent l'entreprise active. */
export const stockApi = (send: ApiClient) => {
  const scoped = { organizationScoped: true } as const
  return {
    warehouses: (status: CatalogStatus = CatalogStatus.active) =>
      send<Warehouse[]>({
        ...scoped,
        method: "GET",
        path:
          StockPaths.warehouses + query({ [StockQueryParams.status]: status }),
      }),
    warehouse: (id: string) =>
      send<Warehouse>({
        ...scoped,
        method: "GET",
        path: StockPaths.warehouse(id),
      }),
    createWarehouse: (id: string, input: WarehouseInput) =>
      send<Warehouse>({
        ...scoped,
        method: "POST",
        path: StockPaths.warehouses,
        body: { id, ...input },
      }),
    updateWarehouse: (id: string, version: number, input: WarehouseInput) =>
      send<Warehouse>({
        ...scoped,
        method: "PUT",
        path: StockPaths.warehouse(id),
        body: { version, ...input },
      }),
    archiveWarehouse: (id: string) =>
      send<Warehouse>({
        ...scoped,
        method: "POST",
        path: StockPaths.warehouseArchive(id),
      }),
    restoreWarehouse: (id: string) =>
      send<Warehouse>({
        ...scoped,
        method: "POST",
        path: StockPaths.warehouseRestore(id),
      }),

    items: (
      search: ItemSearch,
      page: number,
      size: number = StockLimits.pageSize
    ) =>
      send<Page<Item>>({
        ...scoped,
        method: "GET",
        path:
          StockPaths.items +
          query({
            [StockQueryParams.search]: search.text,
            [StockQueryParams.warehouseId]: search.warehouseId,
            [StockQueryParams.status]: search.status,
            [StockQueryParams.page]: page,
            [StockQueryParams.size]: size,
          }),
      }),
    item: (id: string) =>
      send<Item>({ ...scoped, method: "GET", path: StockPaths.item(id) }),
    createItem: (id: string, input: ItemInput) =>
      send<Item>({
        ...scoped,
        method: "POST",
        path: StockPaths.items,
        body: { id, ...input },
      }),
    updateItem: (id: string, version: number, input: ItemInput) =>
      send<Item>({
        ...scoped,
        method: "PUT",
        path: StockPaths.item(id),
        body: { version, ...input },
      }),
    archiveItem: (id: string) =>
      send<Item>({
        ...scoped,
        method: "POST",
        path: StockPaths.itemArchive(id),
      }),
    restoreItem: (id: string) =>
      send<Item>({
        ...scoped,
        method: "POST",
        path: StockPaths.itemRestore(id),
      }),
    uploadItemImage: (id: string, file: File) => {
      const body = new FormData()
      body.append(ItemImageRules.part, file)
      return send<Item>({
        ...scoped,
        method: "PUT",
        path: StockPaths.itemImage(id),
        body,
      })
    },
    removeItemImage: (id: string) =>
      send<Item>({
        ...scoped,
        method: "DELETE",
        path: StockPaths.itemImage(id),
      }),
  }
}
