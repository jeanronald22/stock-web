"use client"

import { ArrowRightIcon, BoxesIcon } from "lucide-react"
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
import { CatalogStatus, type Warehouse } from "@/lib/api/stock"
import {
  useItems,
  useWarehouse,
  useWarehouseStatus,
} from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { ListQueryParams, RecordRoutes, Routes } from "@/lib/routes"

import { WarehouseForm } from "./warehouse-form"

const PREVIEW_ITEMS = 5

export function NewWarehouseScreen() {
  const t = useTranslations("warehouses")
  return (
    <PageBody className="max-w-4xl">
      <PageHeader title={t("form.newTitle")} className="mb-8" />
      <WarehouseForm />
    </PageBody>
  )
}

export function WarehouseScreen({ id }: { id: string }) {
  const t = useTranslations("warehouses")
  const warehouse = useWarehouse(id)

  if (warehouse.isPending) {
    return (
      <PageBody className="max-w-4xl">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-8 h-64 rounded-2xl" />
      </PageBody>
    )
  }
  if (!warehouse.data) {
    return (
      <PageBody>
        <EmptyState
          illustration={<SearchScene />}
          title={t("notFound")}
          description=""
          action={
            <Link
              href={Routes.warehouses}
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
    <WarehouseDetails
      key={warehouse.data.version}
      warehouse={warehouse.data}
      onReload={() => void warehouse.refetch()}
    />
  )
}

function WarehouseDetails({
  warehouse,
  onReload,
}: {
  warehouse: Warehouse
  onReload: () => void
}) {
  const t = useTranslations("warehouses")
  const errorMessage = useErrorMessage()
  const status = useWarehouseStatus()
  const archived = warehouse.status === CatalogStatus.archived

  const changeStatus = (target: CatalogStatus) =>
    status.mutate(
      { id: warehouse.id, status: target },
      {
        onSuccess: () =>
          toast.success(
            target === CatalogStatus.archived
              ? t("archive.done")
              : t("restore.done")
          ),
        onError: (error) => toast.error(errorMessage(error)),
      }
    )

  return (
    <PageBody className="max-w-4xl">
      <PageHeader
        title={warehouse.name}
        description={t(`kinds.${warehouse.kind}.label`)}
        className="mb-8"
        actions={
          <>
            {archived && (
              <Badge variant="secondary">{t("restore.badge")}</Badge>
            )}
            <ArchiveControl
              archived={archived}
              pending={status.isPending}
              archiveLabels={{
                action: t("archive.action"),
                title: t("archive.title"),
                description: t("archive.description"),
              }}
              restoreLabel={t("restore.action")}
              onArchive={() => changeStatus(CatalogStatus.archived)}
              onRestore={() => changeStatus(CatalogStatus.active)}
            />
          </>
        }
      />
      <WarehouseItems warehouse={warehouse} />
      <WarehouseForm warehouse={warehouse} onConflict={onReload} />
    </PageBody>
  )
}

/** Aperçu des articles proposés dans ce dépôt, avec un lien vers la liste filtrée. */
function WarehouseItems({ warehouse }: { warehouse: Warehouse }) {
  const t = useTranslations("warehouses")
  const items = useItems({ warehouseId: warehouse.id })
  const preview = items.data?.pages[0]?.items.slice(0, PREVIEW_ITEMS) ?? []
  const listHref = `${Routes.items}?${ListQueryParams.warehouse}=${warehouse.id}`

  return (
    <section className="mb-10 rounded-2xl border bg-muted/30 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <BoxesIcon className="size-4 text-primary" aria-hidden />
          {t("items.title")}
          <span className="font-normal text-muted-foreground">
            · {t("itemCount", { count: warehouse.itemCount })}
          </span>
        </h2>
        {warehouse.itemCount > 0 && (
          <Link
            href={listHref}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {t("items.seeAll")}
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        )}
      </div>
      {preview.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {preview.map((item) => (
            <li key={item.id}>
              <Link
                href={RecordRoutes.item(item.id)}
                className="inline-flex rounded-full border bg-background px-3 py-1 text-sm transition-colors hover:bg-muted"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        !items.isPending && (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("items.none")}
          </p>
        )
      )}
    </section>
  )
}
