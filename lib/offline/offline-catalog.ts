import { createStore, get, set } from "idb-keyval"

import type { Item } from "@/lib/api/stock"
import type { WarehouseStock } from "@/lib/api/vouchers"

import { PERSISTED_CACHE_VERSION } from "./query-persister"

/**
 * Catalogue actif copié sur le téléphone (D39), par entreprise, avec le stock de chaque article
 * dans les dépôts de la personne : chercher, scanner et consulter un article sans réseau. Gardé à
 * part des autres lectures : il est gros.
 */

const DATABASE = "kreskala-catalog"
const TABLE = "catalogs"

export type OfflineCatalog = {
  items: Item[]
  /** Par article copié (même sans stock) : ses dépôts, comme sur sa fiche (useItemStock). */
  stock: Record<string, WarehouseStock[]>
  syncedAt: number
}
/** Copie gardée avec la version de forme des réponses : une copie d'avant est recopiée. */
type StoredCatalog = OfflineCatalog & { version: string }

type Listener = () => void

let idb: ReturnType<typeof createStore> | null = null
const database = () => (idb ??= createStore(DATABASE, TABLE))
const catalogs = new Map<string, OfflineCatalog>()
const listeners = new Set<Listener>()
const staleListeners = new Set<(organizationId: string) => void>()

const notify = () => listeners.forEach((listener) => listener())

export function subscribeCatalog(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Prévenu quand la copie d'une entreprise ne correspond plus au catalogue (CatalogSync la refait). */
export function subscribeCatalogStale(
  listener: (organizationId: string) => void
): () => void {
  staleListeners.add(listener)
  return () => staleListeners.delete(listener)
}

/**
 * Le catalogue ou le stock vient de changer (article créé, modifié, importé ; bon enregistré) : la
 * copie est à refaire tout de suite, pour qu'elle soit juste sans réseau dès maintenant.
 */
export function markCatalogStale(organizationId: string) {
  const current = catalogs.get(organizationId)
  if (current) catalogs.set(organizationId, { ...current, syncedAt: 0 })
  staleListeners.forEach((listener) => listener(organizationId))
}

export function catalogOf(organizationId: string): OfflineCatalog | undefined {
  return catalogs.get(organizationId)
}

/** Lit la copie gardée sur le téléphone, une fois par entreprise. */
export async function loadCatalog(
  organizationId: string
): Promise<OfflineCatalog | undefined> {
  if (catalogs.has(organizationId)) return catalogs.get(organizationId)
  const saved = await get<StoredCatalog>(organizationId, database()).catch(
    () => undefined
  )
  const stored =
    saved?.version === PERSISTED_CACHE_VERSION
      ? // Copie d'avant le stock : servie sans lui, refaite au prochain passage en ligne.
        {
          items: saved.items,
          stock: saved.stock ?? {},
          syncedAt: saved.syncedAt,
        }
      : undefined
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
  const stored: StoredCatalog = { ...catalog, version: PERSISTED_CACHE_VERSION }
  await set(organizationId, stored, database()).catch(() => undefined)
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
