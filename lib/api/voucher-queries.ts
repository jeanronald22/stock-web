"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useActiveOrganization } from "@/lib/organization/active-organization"

import { useApi } from "./api-provider"
import { stockKeys } from "./stock-queries"
import type {
  StockSearch,
  TransferReceiptInput,
  VoucherInput,
  VoucherSearch,
} from "./vouchers"

/** Sous la clé du stock de l'entreprise : un bon enregistré rafraîchit aussi articles et dépôts. */
export const voucherKeys = {
  vouchers: (
    organizationId: string | null,
    search: VoucherSearch,
    page: number,
    size: number
  ) =>
    [...stockKeys.all(organizationId), "vouchers", search, page, size] as const,
  voucher: (organizationId: string | null, id: string) =>
    [...stockKeys.all(organizationId), "voucher", id] as const,
  stock: (
    organizationId: string | null,
    search: StockSearch,
    page: number,
    size: number
  ) =>
    [...stockKeys.all(organizationId), "levels", search, page, size] as const,
  itemStock: (organizationId: string | null, itemId: string) =>
    [...stockKeys.all(organizationId), "item-stock", itemId] as const,
}

function useOrganizationId() {
  return useActiveOrganization().activeOrganizationId
}

export function useVouchersPage(
  search: VoucherSearch,
  page: number,
  size: number
) {
  const { vouchers } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: voucherKeys.vouchers(organizationId, search, page, size),
    queryFn: () => vouchers.vouchers(search, page, size),
    placeholderData: keepPreviousData,
    enabled: !!organizationId,
  })
}

export function useVoucher(id: string) {
  const { vouchers } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: voucherKeys.voucher(organizationId, id),
    queryFn: () => vouchers.voucher(id),
    enabled: !!organizationId,
  })
}

export function useStockPage(search: StockSearch, page: number, size: number) {
  const { vouchers } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: voucherKeys.stock(organizationId, search, page, size),
    queryFn: () => vouchers.stock(search, page, size),
    placeholderData: keepPreviousData,
    enabled: !!organizationId,
  })
}

/** Stock d'un article, dépôt par dépôt : le disponible affiché pendant la saisie d'une sortie. */
export function useItemStock(itemId: string | undefined) {
  const { vouchers } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: voucherKeys.itemStock(organizationId, itemId ?? ""),
    queryFn: () => vouchers.itemStock(itemId!),
    enabled: !!organizationId && !!itemId,
  })
}

export function useReceiveTransfer() {
  const { vouchers } = useApi()
  const queryClient = useQueryClient()
  const organizationId = useOrganizationId()
  return useMutation({
    mutationFn: ({
      transferId,
      id,
      input,
    }: {
      transferId: string
      id: string
      input: TransferReceiptInput
    }) => vouchers.receiveTransfer(transferId, id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: stockKeys.all(organizationId),
      }),
  })
}

export function useAddVoucherPhoto() {
  const { vouchers } = useApi()
  const queryClient = useQueryClient()
  const organizationId = useOrganizationId()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      vouchers.addPhoto(id, file),
    onSuccess: (voucher) =>
      queryClient.setQueryData(
        voucherKeys.voucher(organizationId, voucher.id),
        voucher
      ),
  })
}

export function useRecordVoucher() {
  const { vouchers } = useApi()
  const queryClient = useQueryClient()
  const organizationId = useOrganizationId()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: VoucherInput }) =>
      vouchers.record(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: stockKeys.all(organizationId),
      }),
  })
}
