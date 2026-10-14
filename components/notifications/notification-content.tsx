"use client"

import {
  BellRingIcon,
  KeyRoundIcon,
  MailOpenIcon,
  FileWarningIcon,
  PackageCheckIcon,
  TruckIcon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { useQuantityLabel } from "@/components/items/describe"
import { NotificationType, type AppNotification } from "@/lib/api/notifications"

/** Articles détaillés dans un avis de stock ; les autres sont comptés (« et 2 autres »). */
const LISTED_ITEMS = 3

export const notificationIcons: Record<NotificationType, LucideIcon> = {
  [NotificationType.stockAlert]: BellRingIcon,
  [NotificationType.memberJoined]: UserPlusIcon,
  [NotificationType.invitationReceived]: MailOpenIcon,
  [NotificationType.accessChanged]: KeyRoundIcon,
  [NotificationType.transferSent]: TruckIcon,
  [NotificationType.transferReceived]: PackageCheckIcon,
  [NotificationType.receiptDiscrepancy]: FileWarningIcon,
}

/** Titre et détail d'une notification, traduits depuis son type et ses paramètres (D26). */
export function useNotificationText() {
  const t = useTranslations("notifications.types")
  const roles = useTranslations("team.stockRoles")
  const quantityLabel = useQuantityLabel()

  return (notification: AppNotification): { title: string; detail: string } => {
    const params = notification.params
    switch (notification.type) {
      case NotificationType.stockAlert: {
        const items = params.items ?? []
        const lines = items.slice(0, LISTED_ITEMS).map((item) =>
          t("STOCK_ALERT.line", {
            name: item.name,
            quantity: quantityLabel(item.baseUnit, Number(item.quantity)),
            threshold:
              item.threshold === null
                ? "—"
                : quantityLabel(item.baseUnit, Number(item.threshold)),
          })
        )
        const others = items.length - LISTED_ITEMS
        return {
          title: t("STOCK_ALERT.title", {
            count: items.length,
            warehouse: params.warehouseName ?? "",
          }),
          detail: [
            ...lines,
            ...(others > 0 ? [t("STOCK_ALERT.others", { count: others })] : []),
          ].join(" · "),
        }
      }
      case NotificationType.memberJoined:
        return {
          title: t("MEMBER_JOINED.title", { name: params.memberName ?? "" }),
          detail: t("MEMBER_JOINED.detail"),
        }
      case NotificationType.invitationReceived:
        return {
          title: params.inviterName
            ? t("INVITATION_RECEIVED.title", {
                inviter: params.inviterName,
                organization: params.organizationName ?? "",
              })
            : t("INVITATION_RECEIVED.titleAnonymous", {
                organization: params.organizationName ?? "",
              }),
          detail: t("INVITATION_RECEIVED.detail"),
        }
      case NotificationType.accessChanged: {
        const warehouses = params.warehouseNames?.length
          ? params.warehouseNames.join(", ")
          : roles("allWarehouses")
        return {
          title: t("ACCESS_CHANGED.title"),
          detail: params.stockRole
            ? t("ACCESS_CHANGED.detail", {
                role: roles(`${params.stockRole}.label`),
                warehouses,
              })
            : t("ACCESS_CHANGED.revoked"),
        }
      }
      case NotificationType.transferSent:
        return {
          title: t("TRANSFER_SENT.title", {
            number: params.voucherNumber ?? "",
            destination: params.warehouseName ?? "",
          }),
          detail: t("TRANSFER_SENT.detail", {
            source: params.sourceName ?? "",
            count: params.lineCount ?? 0,
          }),
        }
      case NotificationType.receiptDiscrepancy: {
        const gaps = params.discrepancies ?? []
        return {
          title: t("RECEIPT_DISCREPANCY.title", {
            number: params.voucherNumber ?? "",
          }),
          detail: gaps
            .slice(0, LISTED_ITEMS)
            .map((gap) =>
              t("RECEIPT_DISCREPANCY.gap", {
                name: gap.name,
                expected: quantityLabel(gap.baseUnit, Number(gap.expected)),
                received: quantityLabel(gap.baseUnit, Number(gap.received)),
              })
            )
            .join(" · "),
        }
      }
      case NotificationType.transferReceived: {
        const gaps = params.discrepancies ?? []
        return {
          title: t("TRANSFER_RECEIVED.title", {
            number: params.voucherNumber ?? "",
            destination: params.warehouseName ?? "",
          }),
          detail:
            gaps.length === 0
              ? t("TRANSFER_RECEIVED.complete")
              : gaps
                  .slice(0, LISTED_ITEMS)
                  .map((gap) =>
                    t("TRANSFER_RECEIVED.gap", {
                      name: gap.name,
                      expected: quantityLabel(
                        gap.baseUnit,
                        Number(gap.expected)
                      ),
                      received: quantityLabel(
                        gap.baseUnit,
                        Number(gap.received)
                      ),
                    })
                  )
                  .join(" · "),
        }
      }
    }
  }
}
