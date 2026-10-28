"use client"

import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  BellRingIcon,
  CalendarClockIcon,
  ChevronsUpIcon,
  KeyRoundIcon,
  HourglassIcon,
  MailOpenIcon,
  ClipboardCheckIcon,
  ClipboardClockIcon,
  ClipboardPenLineIcon,
  FileWarningIcon,
  MoonIcon,
  PackageCheckIcon,
  PackageXIcon,
  ShieldAlertIcon,
  TruckIcon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { useDayLabel, useQuantityLabel } from "@/components/items/describe"
import {
  NotificationType,
  type AppNotification,
  type MovementLine,
  type NotificationParams,
  type RuleAlertLine,
  type StockAlertLine,
} from "@/lib/api/notifications"

/** Articles détaillés dans un avis de stock ; les autres sont comptés (« et 2 autres »). */
const LISTED_ITEMS = 3

export const notificationIcons: Record<NotificationType, LucideIcon> = {
  [NotificationType.stockAlert]: BellRingIcon,
  [NotificationType.stockIn]: ArrowDownToLineIcon,
  [NotificationType.stockOut]: ArrowUpFromLineIcon,
  [NotificationType.stockCorrected]: ClipboardPenLineIcon,
  [NotificationType.memberJoined]: UserPlusIcon,
  [NotificationType.invitationReceived]: MailOpenIcon,
  [NotificationType.accessChanged]: KeyRoundIcon,
  [NotificationType.transferSent]: TruckIcon,
  [NotificationType.transferReceived]: PackageCheckIcon,
  [NotificationType.receiptDiscrepancy]: FileWarningIcon,
  [NotificationType.voucherPending]: ClipboardClockIcon,
  [NotificationType.voucherDecided]: ClipboardCheckIcon,
  [NotificationType.runningOut]: HourglassIcon,
  [NotificationType.dormantStock]: MoonIcon,
  [NotificationType.overstock]: ChevronsUpIcon,
  [NotificationType.abnormalDamage]: PackageXIcon,
  [NotificationType.unreliableSupplier]: ShieldAlertIcon,
  [NotificationType.expiringBatches]: CalendarClockIcon,
}

/** Alertes paramétrables sur des articles (D44) : le type de l'avis dit la forme de ses lignes. */
type RuleAlertType =
  | typeof NotificationType.runningOut
  | typeof NotificationType.dormantStock
  | typeof NotificationType.overstock
  | typeof NotificationType.abnormalDamage
  | typeof NotificationType.expiringBatches

/** Titre et détail d'une notification, traduits depuis son type et ses paramètres (D26). */
export function useNotificationText() {
  const t = useTranslations("notifications.types")
  const movement = useTranslations("notifications.movement")
  const voucherTypes = useTranslations("vouchers.types")
  const reasons = useTranslations("vouchers.reasons")
  const roles = useTranslations("team.stockRoles")
  const quantityLabel = useQuantityLabel()
  const dayLabel = useDayLabel()

  /** Les premières lignes, puis « et 2 autres » : [total] compte toutes les alertes apparues. */
  const listed = (lines: string[], total: number) => {
    const others = total - Math.min(lines.length, LISTED_ITEMS)
    return [
      ...lines.slice(0, LISTED_ITEMS),
      ...(others > 0 ? [t("STOCK_ALERT.others", { count: others })] : []),
    ].join(" · ")
  }

  const ruleAlert = (type: RuleAlertType, params: NotificationParams) => {
    const items = (params.items ?? []) as RuleAlertLine[]
    const total = params.total ?? items.length
    const line = (item: RuleAlertLine) => {
      const where = { name: item.name, warehouse: item.warehouseName }
      const quantity = quantityLabel(item.baseUnit, Number(item.quantity))
      const days = item.days ?? 0
      switch (type) {
        case NotificationType.runningOut:
          return t("RUNNING_OUT.line", { ...where, days })
        case NotificationType.dormantStock:
          return t("DORMANT_STOCK.line", { ...where, quantity, days })
        case NotificationType.overstock:
          return t("OVERSTOCK.line", {
            ...where,
            quantity,
            maximum: quantityLabel(item.baseUnit, Number(item.maximum)),
          })
        case NotificationType.abnormalDamage:
          return t("ABNORMAL_DAMAGE.line", {
            ...where,
            damaged: quantityLabel(item.baseUnit, Number(item.damaged)),
            percent: item.percent ?? 0,
          })
        case NotificationType.expiringBatches: {
          const date = dayLabel(item.expiresOn ?? "")
          return days < 0
            ? t("EXPIRING_BATCHES.expired", {
                ...where,
                batch: item.batch ?? "",
                date,
              })
            : t("EXPIRING_BATCHES.line", {
                ...where,
                batch: item.batch ?? "",
                date,
              })
        }
      }
    }
    return {
      title: t(`${type}.title`, { count: total }),
      detail: listed(items.map(line), total),
    }
  }

  /** « Sortie SOR-2026-0012 · Dépôt Bonabéri », puis qui, le tiers ou le motif, et chaque article (D49). */
  const movementText = (params: NotificationParams) => {
    const items = (params.items ?? []) as MovementLine[]
    const total = params.total ?? items.length
    const context = [
      movement("by", { name: params.actorName ?? "" }),
      ...(params.counterparty ? [params.counterparty] : []),
      ...(params.reason
        ? [movement("reason", { reason: reasons(`${params.reason}.label`) })]
        : []),
    ].join(", ")
    const lines = items.map((item) => {
      const change = Number(item.change)
      const values = {
        name: item.name,
        change: `${change > 0 ? "+" : "−"}\u00a0${quantityLabel(item.baseUnit, Math.abs(change))}`,
      }
      return item.quantity === null
        ? movement("lineAlone", values)
        : movement("line", {
            ...values,
            quantity: quantityLabel(item.baseUnit, Number(item.quantity)),
            state: item.state ?? "OK",
          })
    })
    return {
      title: movement("title", {
        type: params.voucherType ? voucherTypes(params.voucherType) : "",
        number: params.voucherNumber ?? "",
        warehouse: params.warehouseName ?? "",
      }),
      detail: [
        context,
        total === 0 ? movement("unchanged") : listed(lines, total),
      ].join(" · "),
    }
  }

  return (notification: AppNotification): { title: string; detail: string } => {
    const params = notification.params
    switch (notification.type) {
      case NotificationType.stockAlert: {
        // Le type de l'avis dit la forme de ses lignes.
        const items = (params.items ?? []) as StockAlertLine[]
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
      case NotificationType.stockIn:
      case NotificationType.stockOut:
      case NotificationType.stockCorrected:
        return movementText(params)
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
      case NotificationType.voucherPending:
        return {
          title: t("VOUCHER_PENDING.title", {
            name: params.requesterName ?? "",
            warehouse: params.warehouseName ?? "",
          }),
          detail: t("VOUCHER_PENDING.detail", { count: params.lineCount ?? 0 }),
        }
      case NotificationType.voucherDecided:
        return params.approved
          ? {
              title: t("VOUCHER_DECIDED.approved", {
                number: params.voucherNumber ?? "",
              }),
              detail: t("VOUCHER_DECIDED.by", {
                name: params.deciderName ?? "",
              }),
            }
          : {
              title: t("VOUCHER_DECIDED.rejected", {
                warehouse: params.warehouseName ?? "",
              }),
              detail: params.decisionNote ?? "",
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
      case NotificationType.runningOut:
      case NotificationType.dormantStock:
      case NotificationType.overstock:
      case NotificationType.abnormalDamage:
      case NotificationType.expiringBatches:
        return ruleAlert(notification.type, params)
      case NotificationType.unreliableSupplier: {
        const suppliers = params.suppliers ?? []
        const total = params.total ?? suppliers.length
        return {
          title: t("UNRELIABLE_SUPPLIER.title", { count: total }),
          detail: listed(
            suppliers.map((supplier) =>
              t("UNRELIABLE_SUPPLIER.line", {
                name: supplier.name,
                withGap: supplier.withGap,
                receipts: supplier.receipts,
              })
            ),
            total
          ),
        }
      }
    }
  }
}
