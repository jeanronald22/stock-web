import type { ApiClient } from "./http"
import type { CatalogStatus, Page } from "./stock"

/** Routes des fournisseurs (stock-api, StockApi). */
export const SupplierPaths = {
  suppliers: "/v1/suppliers",
  supplier: (id: string) => `/v1/suppliers/${id}`,
  archive: (id: string) => `/v1/suppliers/${id}/archive`,
  restore: (id: string) => `/v1/suppliers/${id}/restore`,
} as const

/** Mêmes limites que l'API (stock-api, StockLimits). */
export const SupplierLimits = {
  name: 120,
  phone: 30,
  email: 120,
  address: 200,
  note: 500,
} as const

export type Supplier = {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  note: string | null
  /** Catalogue : articles qu'il livre. */
  itemIds: string[]
  status: CatalogStatus
  version: number
  createdAt: string
  updatedAt: string
}

export type SupplierInput = {
  name: string
  phone?: string
  email?: string
  address?: string
  note?: string
  itemIds: string[]
}

export type SupplierSearch = { text?: string; status?: CatalogStatus }

export const supplierApi = (send: ApiClient) => {
  const scoped = { organizationScoped: true } as const
  return {
    suppliers: (search: SupplierSearch, page: number, size: number) => {
      const query = new URLSearchParams({
        page: String(page),
        size: String(size),
      })
      if (search.text) query.set("q", search.text)
      if (search.status) query.set("status", search.status)
      return send<Page<Supplier>>({
        ...scoped,
        method: "GET",
        path: `${SupplierPaths.suppliers}?${query}`,
      })
    },
    supplier: (id: string) =>
      send<Supplier>({
        ...scoped,
        method: "GET",
        path: SupplierPaths.supplier(id),
      }),
    create: (id: string, input: SupplierInput) =>
      send<Supplier>({
        ...scoped,
        method: "POST",
        path: SupplierPaths.suppliers,
        body: { id, ...input },
      }),
    update: (id: string, version: number, input: SupplierInput) =>
      send<Supplier>({
        ...scoped,
        method: "PUT",
        path: SupplierPaths.supplier(id),
        body: { version, ...input },
      }),
    archive: (id: string) =>
      send<Supplier>({
        ...scoped,
        method: "POST",
        path: SupplierPaths.archive(id),
      }),
    restore: (id: string) =>
      send<Supplier>({
        ...scoped,
        method: "POST",
        path: SupplierPaths.restore(id),
      }),
  }
}
