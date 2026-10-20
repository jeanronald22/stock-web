import type { ApiClient } from "./http"
import type { BaseUnit, StockRole } from "./stock"

/** Routes des notifications (stock-api, PlatformApi). */
export const NotificationPaths = {
  notifications: "/v1/notifications",
  read: (id: string) => `/v1/notifications/${id}/read`,
  readAll: "/v1/notifications/read-all",
  preferences: "/v1/me/notification-preferences",
} as const

/** Notifications de base (stock-api, NotificationType ; DECISIONS.md, D26). */
export const notificationTypes = [
  "STOCK_ALERT",
  "MEMBER_JOINED",
  "INVITATION_RECEIVED",
  "ACCESS_CHANGED",
  "TRANSFER_SENT",
  "TRANSFER_RECEIVED",
  "RECEIPT_DISCREPANCY",
  "VOUCHER_PENDING",
  "VOUCHER_DECIDED",
  "RUNNING_OUT",
  "DORMANT_STOCK",
  "OVERSTOCK",
  "ABNORMAL_DAMAGE",
  "UNRELIABLE_SUPPLIER",
  "EXPIRING_BATCHES",
] as const
export type NotificationType = (typeof notificationTypes)[number]
export const NotificationType = {
  stockAlert: "STOCK_ALERT",
  memberJoined: "MEMBER_JOINED",
  invitationReceived: "INVITATION_RECEIVED",
  accessChanged: "ACCESS_CHANGED",
  transferSent: "TRANSFER_SENT",
  transferReceived: "TRANSFER_RECEIVED",
  receiptDiscrepancy: "RECEIPT_DISCREPANCY",
  voucherPending: "VOUCHER_PENDING",
  voucherDecided: "VOUCHER_DECIDED",
  runningOut: "RUNNING_OUT",
  dormantStock: "DORMANT_STOCK",
  overstock: "OVERSTOCK",
  abnormalDamage: "ABNORMAL_DAMAGE",
  unreliableSupplier: "UNRELIABLE_SUPPLIER",
  expiringBatches: "EXPIRING_BATCHES",
} as const satisfies Record<string, NotificationType>

/** Paramètres de chaque type (stock-api, NotificationParams). */
export type StockAlertLine = {
  name: string
  state: "LOW" | "OUT"
  quantity: string
  threshold: string | null
  baseUnit: BaseUnit
}
/** Ligne d'une réception (de transfert ou fournisseur) en écart. */
export type TransferGap = {
  name: string
  expected: string
  received: string
  baseUnit: BaseUnit
}
/**
 * Article d'une alerte paramétrable (D44), dans un dépôt ; selon la règle, [days] (que le stock
 * tient encore, depuis la dernière sortie, ou avant la date limite : négatif si elle est passée),
 * [maximum], [damaged] et [percent], [batch] et [expiresOn] (AAAA-MM-JJ).
 */
export type RuleAlertLine = {
  name: string
  warehouseName: string
  quantity: string
  baseUnit: BaseUnit
  days?: number
  maximum?: string
  damaged?: string
  percent?: number
  batch?: string
  expiresOn?: string
}
/** Fournisseur peu fiable (D44) : réceptions de la période, dont avec écart. */
export type SupplierAlertLine = {
  name: string
  receipts: number
  withGap: number
  percent: number
}
export type NotificationParams = {
  warehouseId?: string
  warehouseName?: string
  voucherId?: string
  voucherNumber?: string
  /** Avis de stock : StockAlertLine ; alerte paramétrable sur des articles : RuleAlertLine. */
  items?: StockAlertLine[] | RuleAlertLine[]
  /** Alerte paramétrable : nombre d'alertes apparues ; la liste n'en détaille que les premières. */
  total?: number
  suppliers?: SupplierAlertLine[]
  memberName?: string
  memberUserId?: string
  organizationName?: string
  inviterName?: string | null
  stockRole?: StockRole | null
  warehouseNames?: string[]
  sourceName?: string
  lineCount?: number
  discrepancies?: TransferGap[]
  /** Demande de sortie (D33). */
  requestId?: string
  requesterName?: string
  deciderName?: string | null
  approved?: boolean
  decisionNote?: string | null
}

export type AppNotification = {
  id: string
  type: NotificationType
  params: NotificationParams
  /** Page de l'application liée ; null s'il n'y en a pas. */
  link: string | null
  createdAt: string
  read: boolean
}

export type Notifications = { items: AppNotification[]; unread: number }

export type NotificationPreference = {
  type: NotificationType
  emailEnabled: boolean
}

/** Celles de l'entreprise active (en-tête X-Organization-Id) et celles hors entreprise. */
export const notificationApi = (send: ApiClient) => {
  const scoped = { organizationScoped: true } as const
  return {
    latest: () =>
      send<Notifications>({
        ...scoped,
        method: "GET",
        path: NotificationPaths.notifications,
      }),
    markRead: (id: string) =>
      send<void>({
        ...scoped,
        method: "POST",
        path: NotificationPaths.read(id),
      }),
    markAllRead: () =>
      send<void>({
        ...scoped,
        method: "POST",
        path: NotificationPaths.readAll,
      }),
    preferences: () =>
      send<NotificationPreference[]>({
        method: "GET",
        path: NotificationPaths.preferences,
      }),
    changePreference: (preference: NotificationPreference) =>
      send<NotificationPreference[]>({
        method: "PUT",
        path: NotificationPaths.preferences,
        body: preference,
      }),
  }
}
