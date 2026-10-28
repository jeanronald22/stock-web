"use client"

import { useEffect } from "react"

import { useApi } from "@/lib/api/api-provider"
import { CatalogStatus, type Page } from "@/lib/api/stock"
import {
  loadCatalog,
  type OfflineCatalog,
  saveCatalog,
  subscribeCatalogStale,
} from "@/lib/offline/offline-catalog"
import { useOnline } from "@/lib/offline/use-online"
import { useActiveOrganization } from "@/lib/organization/active-organization"

/** Copie refaite régulièrement : un collègue a pu créer des articles depuis un autre téléphone. */
const REFRESH_MS = 5 * 60 * 1_000
/** Retour dans l'application (on bascule souvent d'appli) : une copie plus récente que ceci suffit. */
const FOREGROUND_MIN_AGE_MS = 60 * 1_000
const VISIBLE = "visible"
/** Le plus grand paquet que l'API accepte (stock-api, PageParams.MAX_SIZE). */
const PAGE_SIZE = 100

/**
 * Copie le catalogue actif et son stock sur le téléphone (D39) quand le réseau est là : à
 * l'ouverture et au retour du réseau, après un changement fait ici (markCatalogStale), au retour
 * dans l'application, puis toutes les cinq minutes. Hors ligne, la recherche, le scan et la fiche
 * d'un article s'en servent.
 */
export function CatalogSync() {
  const { stock, vouchers } = useApi()
  const online = useOnline()
  const organizationId = useActiveOrganization().activeOrganizationId

  useEffect(() => {
    if (!online || !organizationId) return
    let cancelled = false
    let running = false
    // Demandée pendant une copie : celle-ci a pu lire le catalogue d'avant, on recommence ensuite.
    let again = false

    /** Toutes les pages d'une liste ; null si la copie est abandonnée en route. */
    const allPages = async <T,>(
      read: (page: number) => Promise<Page<T>>
    ): Promise<T[] | null> => {
      const rows: T[] = []
      for (let page = 0; ; page++) {
        if (cancelled) return null
        const result = await read(page)
        rows.push(...result.items)
        if (rows.length >= result.total || result.items.length === 0)
          return rows
      }
    }

    const copy = async (minAgeMs: number) => {
      const stored = await loadCatalog(organizationId)
      if (stored && Date.now() - stored.syncedAt < minAgeMs) return
      const catalog: OfflineCatalog = { items: [], stock: {}, syncedAt: 0 }
      try {
        const items = await allPages((page) =>
          stock.items({ status: CatalogStatus.active }, page, PAGE_SIZE)
        )
        if (!items) return
        catalog.items = items
        for (const item of items) catalog.stock[item.id] = []
        // Dépôt par dépôt : la liste du stock filtrée sur un dépôt donne la quantité qui y est.
        const warehouses = await stock.warehouses()
        warehouses.sort((a, b) => a.name.localeCompare(b.name))
        for (const warehouse of warehouses) {
          const rows = await allPages((page) =>
            vouchers.stock({ warehouseIds: [warehouse.id] }, page, PAGE_SIZE)
          )
          if (!rows) return
          for (const row of rows) {
            if (row.quantity === 0 && row.batches.length === 0) continue
            catalog.stock[row.item.id]?.push({
              warehouse: { id: warehouse.id, name: warehouse.name },
              quantity: row.quantity,
              batches: row.batches,
            })
          }
        }
      } catch {
        return
      }
      if (!cancelled)
        await saveCatalog(organizationId, { ...catalog, syncedAt: Date.now() })
    }

    const sync = async (minAgeMs = 0) => {
      if (running) {
        again ||= minAgeMs === 0
        return
      }
      running = true
      try {
        await copy(minAgeMs)
        while (again && !cancelled) {
          again = false
          await copy(0)
        }
      } finally {
        running = false
      }
    }

    void sync()
    const timer = window.setInterval(() => void sync(), REFRESH_MS)
    const stopStale = subscribeCatalogStale((changed) => {
      if (changed === organizationId) void sync()
    })
    const onVisible = () => {
      if (document.visibilityState === VISIBLE) void sync(FOREGROUND_MIN_AGE_MS)
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      stopStale()
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [online, organizationId, stock, vouchers])

  return null
}
