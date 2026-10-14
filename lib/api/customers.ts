import type { ApiClient } from "./http"
import type { CatalogStatus, Page } from "./stock"

/** Routes des clients et chantiers (stock-api, StockApi ; D30). */
export const CustomerPaths = {
  customers: "/v1/customers",
  customer: (id: string) => `/v1/customers/${id}`,
  archive: (id: string) => `/v1/customers/${id}/archive`,
  restore: (id: string) => `/v1/customers/${id}/restore`,
} as const

/** Mêmes limites que l'API (stock-api, StockLimits). */
export const CustomerLimits = {
  name: 120,
  phone: 30,
  address: 200,
  note: 500,
} as const

/** Client (une personne, une entreprise) ou chantier (un lieu de livraison). */
export const customerKinds = ["CUSTOMER", "SITE"] as const
export type CustomerKind = (typeof customerKinds)[number]
export const CustomerKind = {
  customer: "CUSTOMER",
  site: "SITE",
} as const satisfies Record<string, CustomerKind>

export type Customer = {
  id: string
  kind: CustomerKind
  name: string
  phone: string | null
  /** Où livrer : quartier, repère. */
  address: string | null
  note: string | null
  status: CatalogStatus
  version: number
  createdAt: string
  updatedAt: string
}

export type CustomerInput = {
  kind: CustomerKind
  name: string
  phone?: string
  address?: string
  note?: string
}

export type CustomerSearch = {
  text?: string
  status?: CatalogStatus
  kind?: CustomerKind
}

export const customerApi = (send: ApiClient) => {
  const scoped = { organizationScoped: true } as const
  return {
    customers: (search: CustomerSearch, page: number, size: number) => {
      const query = new URLSearchParams({
        page: String(page),
        size: String(size),
      })
      if (search.text) query.set("q", search.text)
      if (search.status) query.set("status", search.status)
      if (search.kind) query.set("kind", search.kind)
      return send<Page<Customer>>({
        ...scoped,
        method: "GET",
        path: `${CustomerPaths.customers}?${query}`,
      })
    },
    customer: (id: string) =>
      send<Customer>({
        ...scoped,
        method: "GET",
        path: CustomerPaths.customer(id),
      }),
    create: (id: string, input: CustomerInput) =>
      send<Customer>({
        ...scoped,
        method: "POST",
        path: CustomerPaths.customers,
        body: { id, ...input },
      }),
    update: (id: string, version: number, input: CustomerInput) =>
      send<Customer>({
        ...scoped,
        method: "PUT",
        path: CustomerPaths.customer(id),
        body: { version, ...input },
      }),
    archive: (id: string) =>
      send<Customer>({
        ...scoped,
        method: "POST",
        path: CustomerPaths.archive(id),
      }),
    restore: (id: string) =>
      send<Customer>({
        ...scoped,
        method: "POST",
        path: CustomerPaths.restore(id),
      }),
  }
}
