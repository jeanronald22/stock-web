"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"

import { EmptyState } from "@/components/catalog/empty-state"
import { SearchScene } from "@/components/illustrations/search-scene"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { ReadOnlyNotice } from "@/components/workspace/read-only-notice"
import { useStockAccess } from "@/components/workspace/stock-access"
import { type Item, type Warehouse, StockPermission } from "@/lib/api/stock"
import { useItem, useWarehouses } from "@/lib/api/stock-queries"
import { RecordRoutes, Routes } from "@/lib/routes"

import { ItemForm } from "./item-form"

function FormSkeleton() {
  return (
    <PageBody>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-8 h-48 rounded-2xl" />
      <Skeleton className="mt-6 h-48 rounded-2xl" />
    </PageBody>
  )
}

/** Modification de la fiche d'un article ; la consultation est ItemDetailScreen. */
export function ItemEditScreen({ id }: { id: string }) {
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
  const manages = useStockAccess().can(StockPermission.manageCatalog)

  return (
    <PageBody>
      <PageHeader
        title={t("items.detail.editTitle")}
        breadcrumbs={[
          { label: t("items.title"), href: Routes.items },
          { label: item.name, href: RecordRoutes.item(item.id) },
          { label: t("items.detail.edit") },
        ]}
        description={item.name}
        className="mb-8"
      />
      {manages ? (
        <ItemForm item={item} warehouses={warehouses} onConflict={onReload} />
      ) : (
        <ReadOnlyNotice />
      )}
    </PageBody>
  )
}
