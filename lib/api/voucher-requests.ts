import type { ApiClient } from "./http"
import { query, type Item, type Page } from "./stock"
import {
  VoucherType,
  type VoucherInput,
  type VoucherRef,
  type WarehouseRef,
} from "./vouchers"

/** Routes des demandes de sortie et des règles Stock (stock-api, StockApi ; D33). */
export const RequestPaths = {
  requests: "/v1/voucher-requests",
  request: (id: string) => `/v1/voucher-requests/${id}`,
  approve: (id: string) => `/v1/voucher-requests/${id}/approve`,
  reject: (id: string) => `/v1/voucher-requests/${id}/reject`,
  withdraw: (id: string) => `/v1/voucher-requests/${id}/withdraw`,
  pendingCount: "/v1/voucher-requests/pending-count",
  settings: "/v1/stock/settings",
} as const

export const RequestQueryParams = {
  status: "status",
  page: "page",
  size: "size",
} as const

/** Ce qui fait sortir du stock à la main (stock-api, VoucherApprovals.APPROVAL_TYPES). */
const APPROVAL_TYPES = [
  VoucherType.issue,
  VoucherType.transferOut,
  VoucherType.supplierReturn,
] as const
export type ApprovalType = (typeof APPROVAL_TYPES)[number]
export const approvalTypes: ReadonlySet<VoucherType> = new Set(APPROVAL_TYPES)

export const requestStatuses = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
] as const
export type RequestStatus = (typeof requestStatuses)[number]
export const RequestStatus = {
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
  withdrawn: "WITHDRAWN",
} as const satisfies Record<string, RequestStatus>

/** Mêmes limites que l'API (stock-api, StockLimits). */
export const DECISION_NOTE_MAX = 500

export type StockSettings = {
  /** Les sorties des magasiniers passent par une validation. */
  issueApproval: boolean
}

export type RequestSummary = {
  id: string
  type: ApprovalType
  warehouse: WarehouseRef
  destination: WarehouseRef | null
  counterparty: string | null
  lineCount: number
  status: RequestStatus
  requestedByName: string
  requestedAt: string
  decidedByName: string | null
  decidedAt: string | null
}

export type RequestLine = {
  item: Item
  enteredQuantity: number
  packagingName: string | null
  /** En unité de base ; null si le conditionnement n'existe plus. */
  quantity: number | null
  batch: string | null
  /** Stock actuel dans le dépôt de départ. */
  available: number
}

export type VoucherRequest = Omit<RequestSummary, "lineCount"> & {
  supplierId: string | null
  customerId: string | null
  origin: VoucherRef | null
  documentReference: string | null
  note: string | null
  lines: RequestLine[]
  decisionNote: string | null
  voucher: VoucherRef | null
  canDecide: boolean
  canWithdraw: boolean
}

export const requestApi = (send: ApiClient) => {
  const scoped = { organizationScoped: true } as const
  const post = (path: string, body?: unknown) =>
    send<VoucherRequest>({ ...scoped, method: "POST", path, body })
  return {
    settings: () =>
      send<StockSettings>({
        ...scoped,
        method: "GET",
        path: RequestPaths.settings,
      }),
    saveSettings: (settings: StockSettings) =>
      send<StockSettings>({
        ...scoped,
        method: "PUT",
        path: RequestPaths.settings,
        body: settings,
      }),
    requests: (status: RequestStatus | undefined, page: number, size: number) =>
      send<Page<RequestSummary>>({
        ...scoped,
        method: "GET",
        path:
          RequestPaths.requests +
          query({
            [RequestQueryParams.status]: status,
            [RequestQueryParams.page]: page,
            [RequestQueryParams.size]: size,
          }),
      }),
    pendingCount: () =>
      send<{ count: number }>({
        ...scoped,
        method: "GET",
        path: RequestPaths.pendingCount,
      }),
    request: (id: string) =>
      send<VoucherRequest>({
        ...scoped,
        method: "GET",
        path: RequestPaths.request(id),
      }),
    submit: (id: string, input: VoucherInput) =>
      post(RequestPaths.requests, { id, ...input }),
    approve: (id: string) => post(RequestPaths.approve(id)),
    reject: (id: string, note: string) =>
      post(RequestPaths.reject(id), { note }),
    withdraw: (id: string) => post(RequestPaths.withdraw(id)),
  }
}
