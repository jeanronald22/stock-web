"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useCallback } from "react"
import { toast } from "sonner"

import { useStockAccess } from "@/components/workspace/stock-access"
import { useApi } from "@/lib/api/api-provider"
import { CatalogStatus, StockPermission, type Item } from "@/lib/api/stock"
import { EntryQueryParams, Routes } from "@/lib/routes"

/**
 * Article d'un code-barres scanné (D34), parmi les articles actifs ; [warehouseId] : seulement
 * s'il est proposé dans ce dépôt. Un code inconnu ou hors du dépôt est dit clairement ; si l'on
 * gère le catalogue, on peut créer l'article avec ce code.
 */
export function useBarcodeLookup() {
  const t = useTranslations("scan")
  const router = useRouter()
  const { stock } = useApi()
  const canCreate = useStockAccess().can(StockPermission.manageCatalog)

  return useCallback(
    async (code: string, warehouseId?: string): Promise<Item | null> => {
      const search = { barcode: code, status: CatalogStatus.active }
      const found = await stock.items(
        { ...search, warehouseIds: warehouseId ? [warehouseId] : undefined },
        0,
        1
      )
      if (found.items[0]) return found.items[0]
      const anywhere = warehouseId
        ? (await stock.items(search, 0, 1)).items[0]
        : undefined
      if (anywhere) {
        toast.warning(t("notInWarehouse", { name: anywhere.name }))
        return null
      }
      toast.warning(t("unknown", { code }), {
        action: canCreate
          ? {
              label: t("createItem"),
              onClick: () =>
                router.push(
                  `${Routes.newItem}?${EntryQueryParams.barcode}=${encodeURIComponent(code)}`
                ),
            }
          : undefined,
      })
      return null
    },
    [stock, t, router, canCreate]
  )
}
