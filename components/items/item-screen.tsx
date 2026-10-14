"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { ArchiveControl } from "@/components/catalog/archive-control"
import { EmptyState } from "@/components/catalog/empty-state"
import { SearchScene } from "@/components/illustrations/search-scene"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useStockAccess } from "@/components/workspace/stock-access"
import {
  CatalogStatus,
  type Item,
  type Warehouse,
  StockPermission,
} from "@/lib/api/stock"
import { useItem, useItemStatus, useWarehouses } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { Routes } from "@/lib/routes"

import { ItemForm } from "./item-form"
import { ItemThresholds } from "./item-thresholds"
import { ItemStockPanel } from "./item-stock-panel"

function FormSkeleton() {
  return (
    <PageBody>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-8 h-48 rounded-2xl" />
      <Skeleton className="mt-6 h-48 rounded-2xl" />
    </PageBody>
  )
}

export function ItemScreen({ id }: { id: string }) {
  const t = useTranslations("items")
  const item = useItem(id)
  const warehouses = useWarehouses()

  if (item.isPending || warehouses.isPending) return <FormSkeleton />
  if (!item.data) {
    return (
      <PageBody>
        <EmptyState
          illustration={<SearchScene />}
          title={t("notFound")}
          description=""
          action={
            <Link
              href={Routes.items}
              className={buttonVariants({ variant: "outline" })}
            >
              {t("title")}
            </Link>
          }
        />
      </PageBody>
    )
  }
  // La clé suit la version : après « Recharger », le formulaire repart de la fiche à jour.
  return (
    <ItemDetails
      key={item.data.version}
      item={item.data}
      warehouses={warehouses.data ?? []}
      onReload={() => void item.refetch()}
    />
  )
}

function ItemDetails({
  item,
  warehouses,
  onReload,
}: {
  item: Item
  warehouses: Warehouse[]
  onReload: () => void
}) {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const status = useItemStatus()
  const { can } = useStockAccess()
  const manages = can(StockPermission.manageCatalog)
  const archived = item.status === CatalogStatus.archived

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
    <PageBody>
      <PageHeader
        title={item.name}
        breadcrumbs={[
          { label: t("items.title"), href: Routes.items },
          { label: item.name },
        ]}
        description={t(`units.${item.baseUnit}.label`)}
        className="mb-8"
        actions={
          <>
            {archived && (
              <Badge variant="secondary">{t("items.restore.badge")}</Badge>
            )}
            {manages && (
              <ArchiveControl
                archived={archived}
                pending={status.isPending}
                archiveLabels={{
                  action: t("items.archive.action"),
                  title: t("items.archive.title"),
                  description: t("items.archive.description"),
                }}
                restoreLabel={t("items.restore.action")}
                onArchive={() => changeStatus(CatalogStatus.archived)}
                onRestore={() => changeStatus(CatalogStatus.active)}
              />
            )}
          </>
        }
      />
      <ItemStockPanel item={item} />
      {!manages && can(StockPermission.setThresholds) && (
        <ItemThresholds item={item} warehouses={warehouses} />
      )}
      <ItemForm
        item={item}
        warehouses={warehouses}
        onConflict={onReload}
        readOnly={!manages}
      />
    </PageBody>
  )
}
