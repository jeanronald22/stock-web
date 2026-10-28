"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useActiveOrganization } from "@/lib/organization/active-organization"

import { useApi } from "./api-provider"
import { CatalogStatus } from "./stock"
import { invalidateStock, stockKeys } from "./stock-queries"
import type { SupplierInput, SupplierSearch } from "./suppliers"

export const supplierKeys = {
  suppliers: (
    organizationId: string | null,
    search: SupplierSearch,
    page: number,
    size: number
  ) =>
    [
      ...stockKeys.all(organizationId),
      "suppliers",
      search,
      page,
      size,
    ] as const,
  supplier: (organizationId: string | null, id: string) =>
    [...stockKeys.all(organizationId), "supplier", id] as const,
}

function useOrganizationId() {
  return useActiveOrganization().activeOrganizationId
}

export function useSuppliersPage(
  search: SupplierSearch,
  page: number,
  size: number
) {
  const { suppliers } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: supplierKeys.suppliers(organizationId, search, page, size),
    queryFn: () => suppliers.suppliers(search, page, size),
    placeholderData: keepPreviousData,
    enabled: !!organizationId,
  })
}

export function useSupplier(id: string | undefined) {
  const { suppliers } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: supplierKeys.supplier(organizationId, id ?? ""),
    queryFn: () => suppliers.supplier(id!),
    enabled: !!organizationId && !!id,
  })
}

/** Après toute écriture, le stock de l'entreprise est relu (fournisseurs, articles, bons). */
function useSupplierMutation<Input, Output>(
  mutationFn: (input: Input) => Promise<Output>
) {
  const queryClient = useQueryClient()
  const organizationId = useOrganizationId()
  return useMutation({
    mutationFn,
    onSuccess: () => invalidateStock(queryClient, organizationId),
  })
}

export function useSaveSupplier() {
  const { suppliers } = useApi()
  return useSupplierMutation(
    ({
      id,
      version,
      input,
    }: {
      id: string
      version?: number
      input: SupplierInput
    }) =>
      version === undefined
        ? suppliers.create(id, input)
        : suppliers.update(id, version, input)
  )
}

export function useSupplierStatus() {
  const { suppliers } = useApi()
  return useSupplierMutation(
    ({ id, status }: { id: string; status: CatalogStatus }) =>
      status === CatalogStatus.archived
        ? suppliers.archive(id)
        : suppliers.restore(id)
  )
}
