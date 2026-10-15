"use client"

import { useCallback } from "react"

import { useApi } from "@/lib/api/api-provider"
import { CatalogStatus, type Item } from "@/lib/api/stock"

/** Ce qu'un code scanné a donné : l'article, un article hors du dépôt, ou rien. */
export type BarcodeLookup =
  | { kind: "found"; item: Item }
  | { kind: "outside"; code: string; item: Item }
  | { kind: "unknown"; code: string }

export const BarcodeLookupKind = {
  found: "found",
  outside: "outside",
  unknown: "unknown",
} as const satisfies Record<string, BarcodeLookup["kind"]>

/**
 * Article d'un code-barres scanné (D34), parmi les articles actifs ; [warehouseId] : seulement s'il
 * est proposé dans ce dépôt. L'écran dit lui-même ce qui ne va pas, là où l'on regarde.
 */
export function useBarcodeLookup() {
  const { stock } = useApi()
  return useCallback(
    async (code: string, warehouseId?: string): Promise<BarcodeLookup> => {
      const search = { barcode: code, status: CatalogStatus.active }
      const found = await stock.items(
        { ...search, warehouseIds: warehouseId ? [warehouseId] : undefined },
        0,
        1
      )
      if (found.items[0])
        return { kind: BarcodeLookupKind.found, item: found.items[0] }
      const anywhere = warehouseId
        ? (await stock.items(search, 0, 1)).items[0]
        : undefined
      return anywhere
        ? { kind: BarcodeLookupKind.outside, code, item: anywhere }
        : { kind: BarcodeLookupKind.unknown, code }
    },
    [stock]
  )
}
