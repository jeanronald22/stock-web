"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

import { ListQueryParams } from "@/lib/routes"

/** Nombres de lignes proposés ; le premier de la liste n'est pas le défaut (voir DEFAULT_PAGE_SIZE). */
export const PAGE_SIZES = [25, 50, 100] as const
export const DEFAULT_PAGE_SIZE = 50

export type ListParams = {
  text: string
  warehouseId: string | undefined
  /** Page affichée, à partir de 0 (l'adresse montre « page=1 » pour la première). */
  page: number
  size: number
}

function positiveInteger(value: string | null): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

/**
 * État d'une liste dans l'adresse (recherche, dépôt, page, lignes) : un lien partagé ou un retour
 * arrière rouvre exactement la même vue. Changer un filtre ramène à la première page.
 */
export function useListParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const size = positiveInteger(searchParams.get(ListQueryParams.size))
  const params: ListParams = {
    text: searchParams.get(ListQueryParams.search) ?? "",
    warehouseId: searchParams.get(ListQueryParams.warehouse) ?? undefined,
    page: (positiveInteger(searchParams.get(ListQueryParams.page)) ?? 1) - 1,
    size:
      PAGE_SIZES.find((candidate) => candidate === size) ?? DEFAULT_PAGE_SIZE,
  }

  const update = useCallback(
    (
      changes: Partial<
        Record<keyof typeof ListQueryParams, string | number | undefined>
      >
    ) => {
      const next = new URLSearchParams(searchParams)
      Object.entries(changes).forEach(([key, value]) => {
        const name = ListQueryParams[key as keyof typeof ListQueryParams]
        if (value === undefined || value === "") next.delete(name)
        else next.set(name, String(value))
      })
      if (!("page" in changes)) next.delete(ListQueryParams.page)
      const query = next.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    },
    [router, pathname, searchParams]
  )

  return {
    params,
    setText: (text: string) => update({ search: text.trim() || undefined }),
    setWarehouse: (warehouseId: string | undefined) =>
      update({ warehouse: warehouseId }),
    setPage: (page: number) =>
      update({ page: page > 0 ? page + 1 : undefined }),
    setSize: (pageSize: number) =>
      update({ size: pageSize === DEFAULT_PAGE_SIZE ? undefined : pageSize }),
    reset: () => update({ search: undefined, warehouse: undefined }),
  }
}
