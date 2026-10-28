"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useActiveOrganization } from "@/lib/organization/active-organization"

import { useApi } from "./api-provider"
import type { CountInput, InventoryStatus, SheetSearch } from "./inventories"
import { invalidateStock, stockKeys } from "./stock-queries"

export const inventoryKeys = {
  all: (organizationId: string | null) =>
    [...stockKeys.all(organizationId), "inventories"] as const,
  list: (
    organizationId: string | null,
    status: InventoryStatus | undefined,
    page: number,
    size: number
  ) =>
    [...inventoryKeys.all(organizationId), "list", status, page, size] as const,
  inventory: (organizationId: string | null, id: string) =>
    [...inventoryKeys.all(organizationId), "inventory", id] as const,
  lines: (
    organizationId: string | null,
    id: string,
    search: SheetSearch,
    page: number,
    size: number
  ) =>
    [
      ...inventoryKeys.all(organizationId),
      "lines",
      id,
      search,
      page,
      size,
    ] as const,
}

function useOrganizationId() {
  return useActiveOrganization().activeOrganizationId
}

export function useInventories(
  status: InventoryStatus | undefined,
  page: number,
  size: number
) {
  const { inventories } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: inventoryKeys.list(organizationId, status, page, size),
    queryFn: () => inventories.inventories({ status }, page, size),
    placeholderData: keepPreviousData,
    enabled: !!organizationId,
  })
}

export function useInventory(id: string) {
  const { inventories } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: inventoryKeys.inventory(organizationId, id),
    queryFn: () => inventories.inventory(id),
    enabled: !!organizationId,
  })
}

export function useInventoryLines(
  id: string,
  search: SheetSearch,
  page: number,
  size: number
) {
  const { inventories } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: inventoryKeys.lines(organizationId, id, search, page, size),
    queryFn: () => inventories.lines(id, search, page, size),
    placeholderData: keepPreviousData,
    enabled: !!organizationId,
  })
}

/** Ouverture, clôture, annulation : l'inventaire, sa feuille et le stock sont relus. */
function useInventoryMutation<Input, Output>(
  mutationFn: (input: Input) => Promise<Output>
) {
  const queryClient = useQueryClient()
  const organizationId = useOrganizationId()
  return useMutation({
    mutationFn,
    onSuccess: () => invalidateStock(queryClient, organizationId),
  })
}

export function useStartInventory() {
  const { inventories } = useApi()
  return useInventoryMutation(
    ({
      id,
      warehouseId,
      categoryId,
    }: {
      id: string
      warehouseId: string
      categoryId?: string
    }) => inventories.start(id, warehouseId, categoryId)
  )
}

export function useCloseInventory() {
  const { inventories } = useApi()
  return useInventoryMutation((id: string) => inventories.close(id))
}

export function useCancelInventory() {
  const { inventories } = useApi()
  return useInventoryMutation((id: string) => inventories.cancel(id))
}

/**
 * Un comptage ne change pas le stock : seuls l'inventaire (progression) et sa feuille sont relus,
 * pas tout le stock de l'entreprise.
 */
export function useCountLine(inventoryId: string) {
  const { inventories } = useApi()
  const queryClient = useQueryClient()
  const organizationId = useOrganizationId()
  return useMutation({
    mutationFn: (input: CountInput) => inventories.count(inventoryId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.all(organizationId),
      }),
  })
}
