import { createStore, get, set } from "idb-keyval"

import type { Item } from "@/lib/api/stock"

/**
 * Catalogue actif copié sur le téléphone (D39), par entreprise : chercher et scanner un article
 * sans réseau. Gardé à part des autres lectures : il est gros et change peu.
 */

const DATABASE = "kreskala-catalog"
const TABLE = "catalogs"

export type OfflineCatalog = { items: Item[]; syncedAt: number }

type Listener = () => void

let idb: ReturnType<typeof createStore> | null = null
const database = () => (idb ??= createStore(DATABASE, TABLE))
const catalogs = new Map<string, OfflineCatalog>()
const listeners = new Set<Listener>()

const notify = () => listeners.forEach((listener) => listener())

export function subscribeCatalog(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function catalogOf(organizationId: string): OfflineCatalog | undefined {
  return catalogs.get(organizationId)
}

/** Lit la copie gardée sur le téléphone, une fois par entreprise. */
export async function loadCatalog(
  organizationId: string
): Promise<OfflineCatalog | undefined> {
  if (catalogs.has(organizationId)) return catalogs.get(organizationId)
  const stored = await get<OfflineCatalog>(organizationId, database()).catch(
    () => undefined
  )
  if (stored) {
    catalogs.set(organizationId, stored)
    notify()
  }
  return stored
}

export async function saveCatalog(
  organizationId: string,
  catalog: OfflineCatalog
): Promise<void> {
  catalogs.set(organizationId, catalog)
  notify()
  await set(organizationId, catalog, database()).catch(() => undefined)
}

/** Recherche locale, comme l'API : un morceau du nom, de la référence ou du code-barres exact. */
export function searchCatalog(
  items: Item[],
  search: { text?: string; warehouseId?: string; barcode?: string },
  limit: number
): Item[] {
  const text = search.text?.trim().toLocaleLowerCase()
  return items
    .filter(
      (item) =>
        (!search.warehouseId ||
          item.warehouses.some(
            (placement) => placement.warehouseId === search.warehouseId
          )) &&
        (!search.barcode || item.barcode === search.barcode) &&
        (!text ||
          item.name.toLocaleLowerCase().includes(text) ||
          item.reference?.toLocaleLowerCase().includes(text) ||
          item.barcode === search.text?.trim())
    )
    .slice(0, limit)
}
