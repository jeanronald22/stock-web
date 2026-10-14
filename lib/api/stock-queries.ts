"use client"

import { useEffect } from "react"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useActiveOrganization } from "@/lib/organization/active-organization"

import { useApi } from "./api-provider"
import {
  CatalogStatus,
  type ItemInput,
  type ItemSearch,
  type WarehouseInput,
} from "./stock"

/**
 * Clés de cache préfixées par l'entreprise active : changer d'entreprise ne montre jamais, même
 * un instant, les articles de la précédente.
 */
export const stockKeys = {
  all: (organizationId: string | null) => ["stock", organizationId] as const,
  warehouses: (organizationId: string | null, status: CatalogStatus) =>
    [...stockKeys.all(organizationId), "warehouses", status] as const,
  warehouse: (organizationId: string | null, id: string) =>
    [...stockKeys.all(organizationId), "warehouse", id] as const,
  items: (
    organizationId: string | null,
    search: ItemSearch,
    page: number,
    size: number
  ) => [...stockKeys.all(organizationId), "items", search, page, size] as const,
  itemCount: (organizationId: string | null) =>
    [...stockKeys.all(organizationId), "item-count"] as const,
  item: (organizationId: string | null, id: string) =>
    [...stockKeys.all(organizationId), "item", id] as const,
}

function useOrganizationId() {
  return useActiveOrganization().activeOrganizationId
}

export function useWarehouses(status: CatalogStatus = CatalogStatus.active) {
  const { stock } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: stockKeys.warehouses(organizationId, status),
    queryFn: () => stock.warehouses(status),
    enabled: !!organizationId,
  })
}

export function useWarehouse(id: string) {
  const { stock } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: stockKeys.warehouse(organizationId, id),
    queryFn: () => stock.warehouse(id),
    enabled: !!organizationId,
  })
}

/**
 * Une page d'articles. La page affichée reste visible pendant le chargement de la suivante, et la
 * page d'après est préchargée : « Suivant » s'affiche sans attente.
 */
export function useItemsPage(search: ItemSearch, page: number, size: number) {
  const { stock } = useApi()
  const queryClient = useQueryClient()
  const organizationId = useOrganizationId()
  const query = useQuery({
    queryKey: stockKeys.items(organizationId, search, page, size),
    queryFn: () => stock.items(search, page, size),
    placeholderData: keepPreviousData,
    enabled: !!organizationId,
  })

  const hasNext = !!query.data && (page + 1) * size < query.data.total
  useEffect(() => {
    if (!hasNext || !organizationId) return
    void queryClient.prefetchQuery({
      queryKey: stockKeys.items(organizationId, search, page + 1, size),
      queryFn: () => stock.items(search, page + 1, size),
    })
  }, [hasNext, organizationId, queryClient, stock, search, page, size])

  return query
}

/** Nombre d'articles actifs, pour l'accueil : une seule ligne demandée. */
export function useItemCount() {
  const { stock } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: stockKeys.itemCount(organizationId),
    queryFn: async () => (await stock.items({}, 0, 1)).total,
    enabled: !!organizationId,
  })
}

export function useItem(id: string) {
  const { stock } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: stockKeys.item(organizationId, id),
    queryFn: () => stock.item(id),
    enabled: !!organizationId,
  })
}

/** Après toute écriture, le catalogue de l'entreprise est relu : listes, compteurs et fiches restent cohérents. */
function useStockMutation<Input, Output>(
  mutationFn: (input: Input) => Promise<Output>
) {
  const queryClient = useQueryClient()
  const organizationId = useOrganizationId()
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: stockKeys.all(organizationId),
      }),
  })
}

export function useSaveWarehouse() {
  const { stock } = useApi()
  return useStockMutation(
    ({
      id,
      version,
      input,
    }: {
      id: string
      version?: number
      input: WarehouseInput
    }) =>
      version === undefined
        ? stock.createWarehouse(id, input)
        : stock.updateWarehouse(id, version, input)
  )
}

export function useWarehouseStatus() {
  const { stock } = useApi()
  return useStockMutation(
    ({ id, status }: { id: string; status: CatalogStatus }) =>
      status === CatalogStatus.archived
        ? stock.archiveWarehouse(id)
        : stock.restoreWarehouse(id)
  )
}

export function useSaveItem() {
  const { stock } = useApi()
  return useStockMutation(
    ({
      id,
      version,
      input,
    }: {
      id: string
      version?: number
      input: ItemInput
    }) =>
      version === undefined
        ? stock.createItem(id, input)
        : stock.updateItem(id, version, input)
  )
}

export function useItemStatus() {
  const { stock } = useApi()
  return useStockMutation(
    ({ id, status }: { id: string; status: CatalogStatus }) =>
      status === CatalogStatus.archived
        ? stock.archiveItem(id)
        : stock.restoreItem(id)
  )
}
