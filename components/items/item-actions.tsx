"use client"

import { ArrowDownToLineIcon, ArrowUpFromLineIcon, TagIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { RecordActions } from "@/components/records/record-actions"
import { useStockAccess } from "@/components/workspace/stock-access"
import { CatalogStatus, StockPermission, type Item } from "@/lib/api/stock"
import { useItemStatus } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import {
  EntryQueryParams,
  LabelQueryParams,
  RecordRoutes,
  Routes,
} from "@/lib/routes"

/** Modifier (catalogue), commencer un bon avec l'article, archiver ou restaurer. */
export function ItemActions({
  item,
  manages,
  archived,
}: {
  item: Item
  manages: boolean
  archived: boolean
}) {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const status = useItemStatus()
  const records = useStockAccess().can(StockPermission.recordMovements)
  const withItem = (route: string) =>
    `${route}?${EntryQueryParams.item}=${item.id}`
  const changeStatus = (target: CatalogStatus) =>
    status.mutate(
      { id: item.id, status: target },
      {
        onSuccess: () =>
          toast.success(
            target === CatalogStatus.archived
              ? t("items.archive.done")
              : t("items.restore.done")
          ),
        onError: (error) => toast.error(errorMessage(error)),
      }
    )
  return (
    <RecordActions
      editHref={manages ? RecordRoutes.itemEdit(item.id) : undefined}
      actions={
        archived
          ? []
          : [
              ...(records
                ? [
                    {
                      icon: ArrowDownToLineIcon,
                      label: t("items.detail.receive"),
                      href: withItem(Routes.newReceipt),
                    },
                    {
                      icon: ArrowUpFromLineIcon,
                      label: t("items.detail.issue"),
                      href: withItem(Routes.newIssue),
                    },
                  ]
                : []),
              {
                icon: TagIcon,
                label: t("items.detail.labels"),
                href: `${Routes.labels}?${LabelQueryParams.items}=${item.id}`,
              },
            ]
      }
      archive={
        manages
          ? {
              archived,
              labels: {
                action: t("items.archive.action"),
                title: t("items.archive.title"),
                description: t("items.archive.description"),
                restore: t("items.restore.action"),
              },
              onArchive: () => changeStatus(CatalogStatus.archived),
              onRestore: () => changeStatus(CatalogStatus.active),
            }
          : undefined
      }
    />
  )
}
