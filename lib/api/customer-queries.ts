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
import { stockKeys } from "./stock-queries"
import type { CustomerInput, CustomerSearch } from "./customers"

export const customerKeys = {
  customers: (
    organizationId: string | null,
    search: CustomerSearch,
    page: number,
    size: number
  ) =>
    [
      ...stockKeys.all(organizationId),
      "customers",
      search,
      page,
      size,
    ] as const,
  customer: (organizationId: string | null, id: string) =>
    [...stockKeys.all(organizationId), "customer", id] as const,
}

function useOrganizationId() {
  return useActiveOrganization().activeOrganizationId
}

export function useCustomersPage(
  search: CustomerSearch,
  page: number,
  size: number
) {
  const { customers } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: customerKeys.customers(organizationId, search, page, size),
    queryFn: () => customers.customers(search, page, size),
    placeholderData: keepPreviousData,
    enabled: !!organizationId,
  })
}

export function useCustomer(id: string | undefined) {
  const { customers } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: customerKeys.customer(organizationId, id ?? ""),
    queryFn: () => customers.customer(id!),
    enabled: !!organizationId && !!id,
  })
}

/** Après toute écriture, le stock de l'entreprise est relu (clients, bons). */
function useCustomerMutation<Input, Output>(
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

export function useSaveCustomer() {
  const { customers } = useApi()
  return useCustomerMutation(
    ({
      id,
      version,
      input,
    }: {
      id: string
      version?: number
      input: CustomerInput
    }) =>
      version === undefined
        ? customers.create(id, input)
        : customers.update(id, version, input)
  )
}

export function useCustomerStatus() {
  const { customers } = useApi()
  return useCustomerMutation(
    ({ id, status }: { id: string; status: CatalogStatus }) =>
      status === CatalogStatus.archived
        ? customers.archive(id)
        : customers.restore(id)
  )
}
