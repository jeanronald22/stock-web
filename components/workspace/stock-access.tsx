"use client"

import { LockKeyholeIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { createContext, use, useMemo } from "react"

import { Splash } from "@/components/app/splash"
import { EmptyState } from "@/components/catalog/empty-state"
import { useMyStockAccess } from "@/lib/api/stock-queries"
import type { MyStockAccess, StockPermission } from "@/lib/api/stock"
import { Routes } from "@/lib/routes"

import { PageBody } from "./page-header"

export type StockAccessContext = {
  access: MyStockAccess
  can: (permission: StockPermission) => boolean
  /** Dépôt attribué au rôle (toujours vrai pour un gérant). */
  covers: (warehouseId: string) => boolean
}

const Context = createContext<StockAccessContext | null>(null)

/** Écrans du compte et de l'équipe, ouverts même sans rôle Stock. */
const ACCOUNT_ROUTES = [Routes.team, Routes.notificationSettings]

/**
 * Rôle Stock de la personne connectée (DECISIONS.md, D25). L'API refuse de toute façon ce que le
 * rôle ne permet pas : ici, on évite seulement de proposer une action vouée à l'échec. Un membre
 * sans rôle Stock voit un message au lieu de l'écran, sauf sur les écrans de l'équipe et de son
 * compte : un administrateur peut gérer l'équipe sans utiliser Stock.
 */
export function StockAccessProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const t = useTranslations()
  const pathname = usePathname()
  const gated = !ACCOUNT_ROUTES.some((route) => pathname.startsWith(route))
  const query = useMyStockAccess()
  const value = useMemo<StockAccessContext | null>(() => {
    if (!query.data) return null
    const access = query.data
    const permissions = new Set(access.permissions)
    const warehouses = access.warehouseIds && new Set(access.warehouseIds)
    return {
      access,
      can: (permission) => permissions.has(permission),
      covers: (warehouseId) => !warehouses || warehouses.has(warehouseId),
    }
  }, [query.data])

  if (!value) {
    // Erreur de chargement : l'écran affichera lui-même l'erreur de ses propres données.
    if (query.isError) return children
    return <Splash label={t("common.loading")} />
  }
  if (gated && !value.access.role) {
    return (
      <PageBody>
        <EmptyState
          illustration={
            <LockKeyholeIcon className="mx-auto size-16 text-muted-foreground" />
          }
          title={t("access.none.title")}
          description={t("access.none.description")}
        />
      </PageBody>
    )
  }
  return <Context value={value}>{children}</Context>
}

/** Sans fournisseur (erreur de chargement), rien n'est proposé au-delà de la lecture. */
export function useStockAccess(): StockAccessContext {
  return (
    use(Context) ?? {
      access: { role: null, warehouseIds: [], permissions: [], owner: false },
      can: () => false,
      covers: () => false,
    }
  )
}
