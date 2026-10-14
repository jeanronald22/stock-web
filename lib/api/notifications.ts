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
] as const
export type NotificationType = (typeof notificationTypes)[number]
export const NotificationType = {
  stockAlert: "STOCK_ALERT",
  memberJoined: "MEMBER_JOINED",
  invitationReceived: "INVITATION_RECEIVED",
  accessChanged: "ACCESS_CHANGED",
} as const satisfies Record<string, NotificationType>

/** Paramètres de chaque type (stock-api, NotificationParams). */
export type StockAlertLine = {
  name: string
  state: "LOW" | "OUT"
  quantity: string
  threshold: string | null
  baseUnit: BaseUnit
}
export type NotificationParams = {
  warehouseId?: string
  warehouseName?: string
  voucherId?: string
  voucherNumber?: string
  items?: StockAlertLine[]
  memberName?: string
  memberUserId?: string
  organizationName?: string
  inviterName?: string | null
  stockRole?: StockRole | null
  warehouseNames?: string[]
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
