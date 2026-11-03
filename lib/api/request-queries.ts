"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useActiveOrganization } from "@/lib/organization/active-organization"

import { useApi } from "./api-provider"
import { invalidateStock, stockKeys } from "./stock-queries"
import type { RequestStatus, StockSettings } from "./voucher-requests"
import type { VoucherInput } from "./vouchers"

export const requestKeys = {
  all: (organizationId: string | null) =>
    [...stockKeys.all(organizationId), "requests"] as const,
  list: (
    organizationId: string | null,
    status: RequestStatus | undefined,
    page: number,
    size: number
  ) =>
    [...requestKeys.all(organizationId), "list", status, page, size] as const,
  pendingCount: (organizationId: string | null) =>
    [...requestKeys.all(organizationId), "pending-count"] as const,
  request: (organizationId: string | null, id: string) =>
    [...requestKeys.all(organizationId), "request", id] as const,
  settings: (organizationId: string | null) =>
    [...stockKeys.all(organizationId), "settings"] as const,
}

/**
 * Les demandes se font à plusieurs (qui prépare, qui valide) : relues à chaque ouverture d'écran
 * et chaque minute, plutôt que gardées en cache.
 */
const REFRESH_MS = 60_000
const SHARED = { staleTime: 0, refetchInterval: REFRESH_MS } as const

function useOrganizationId() {
  return useActiveOrganization().activeOrganizationId
}

export function useStockSettings() {
  const { requests } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: requestKeys.settings(organizationId),
    queryFn: () => requests.settings(),
    enabled: !!organizationId,
  })
}

export function useSaveStockSettings() {
  const { requests } = useApi()
  const queryClient = useQueryClient()
  const organizationId = useOrganizationId()
  return useMutation({
    mutationFn: (settings: Partial<StockSettings>) =>
      requests.saveSettings(settings),
    onSuccess: (settings) =>
      queryClient.setQueryData(requestKeys.settings(organizationId), settings),
  })
}

export function useRequests(
  status: RequestStatus | undefined,
  page: number,
  size: number
) {
  const { requests } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: requestKeys.list(organizationId, status, page, size),
    queryFn: () => requests.requests(status, page, size),
    placeholderData: keepPreviousData,
    enabled: !!organizationId,
    ...SHARED,
  })
}

export function usePendingRequestCount() {
  const { requests } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: requestKeys.pendingCount(organizationId),
    queryFn: () => requests.pendingCount(),
    enabled: !!organizationId,
    ...SHARED,
  })
}

export function useRequest(id: string | undefined) {
  const { requests } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: requestKeys.request(organizationId, id ?? ""),
    queryFn: () => requests.request(id!),
    enabled: !!organizationId && !!id,
    ...SHARED,
  })
}

/** Toute décision change le stock ou les listes : le stock de l'entreprise est relu. */
function useRequestMutation<Input, Output>(
  mutationFn: (input: Input) => Promise<Output>
) {
  const queryClient = useQueryClient()
  const organizationId = useOrganizationId()
  return useMutation({
    mutationFn,
    onSuccess: () => invalidateStock(queryClient, organizationId),
  })
}

export function useSubmitRequest() {
  const { requests } = useApi()
  return useRequestMutation(
    ({ id, input }: { id: string; input: VoucherInput }) =>
      requests.submit(id, input)
  )
}

export function useApproveRequest() {
  const { requests } = useApi()
  return useRequestMutation((id: string) => requests.approve(id))
}

export function useRejectRequest() {
  const { requests } = useApi()
  return useRequestMutation(({ id, note }: { id: string; note: string }) =>
    requests.reject(id, note)
  )
}

export function useWithdrawRequest() {
  const { requests } = useApi()
  return useRequestMutation((id: string) => requests.withdraw(id))
}
