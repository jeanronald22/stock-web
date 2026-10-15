"use client"

import { useEffect } from "react"

import { useApi } from "@/lib/api/api-provider"
import { CatalogStatus, type Item } from "@/lib/api/stock"
import { loadCatalog, saveCatalog } from "@/lib/offline/offline-catalog"
import { useOnline } from "@/lib/offline/use-online"
import { useActiveOrganization } from "@/lib/organization/active-organization"

/** Le catalogue change peu : une copie par quart d'heure suffit. */
const REFRESH_MS = 15 * 60 * 1_000
/** Le plus grand paquet que l'API accepte (stock-api, PageParams.MAX_SIZE). */
const PAGE_SIZE = 100

/**
 * Copie le catalogue actif sur le téléphone (D39) quand le réseau est là : à l'ouverture, puis
 * tous les quarts d'heure. Hors ligne, la recherche et le scan s'en servent.
 */
export function CatalogSync() {
  const { stock } = useApi()
  const online = useOnline()
  const organizationId = useActiveOrganization().activeOrganizationId

  useEffect(() => {
    if (!online || !organizationId) return
    let cancelled = false
    const sync = async () => {
      const stored = await loadCatalog(organizationId)
      if (stored && Date.now() - stored.syncedAt < REFRESH_MS) return
      const items: Item[] = []
      try {
        for (let page = 0; !cancelled; page++) {
          const result = await stock.items(
            { status: CatalogStatus.active },
            page,
            PAGE_SIZE
          )
          items.push(...result.items)
          if (items.length >= result.total || result.items.length === 0) break
        }
      } catch {
        return
      }
      if (!cancelled)
        await saveCatalog(organizationId, { items, syncedAt: Date.now() })
    }
    void sync()
    const timer = window.setInterval(() => void sync(), REFRESH_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [online, organizationId, stock])

  return null
}
