"use client"

import { MapPinIcon, PlusIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { EmptyState } from "@/components/catalog/empty-state"
import { StatusFilter } from "@/components/catalog/status-filter"
import { DepotScene } from "@/components/illustrations/depot-scene"
import { usePageTour } from "@/components/tour/tour-provider"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { CatalogStatus, type Warehouse, StockPermission } from "@/lib/api/stock"
import { useWarehouses } from "@/lib/api/stock-queries"
import { useListParams } from "@/lib/list/use-list-params"
import { RecordRoutes, Routes } from "@/lib/routes"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"
import { useStockAccess } from "@/components/workspace/stock-access"

import { warehouseKindIcons } from "./warehouse-kind"

const SKELETON_CARDS = 3

export function WarehousesScreen() {
  const t = useTranslations("warehouses")
  const list = useListParams()
  const { status } = list.params
  const warehouses = useWarehouses(status)
  // Moins de cent dépôts par entreprise : la liste des archivés se charge entière, sans pagination.
  const archivedWarehouses = useWarehouses(CatalogStatus.archived)
  const archived = status === CatalogStatus.archived
  // Sans dépôt, l'action est portée par l'écran vide : pas de second bouton dans l'en-tête.
  const empty =
    warehouses.isSuccess && warehouses.data.length === 0 && !archived
  usePageTour("warehouses", { ready: warehouses.isSuccess })

  const allowed = useStockAccess().can(StockPermission.manageWarehouses)
  const newButton = allowed && (
    <Link
      href={Routes.newWarehouse}
      className={buttonVariants({ size: "lg" })}
      {...tourAnchor(TourAnchors.newWarehouse)}
    >
      <PlusIcon />
      {t("new")}
    </Link>
  )

  return (
    <PageBody>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={empty || !newButton ? undefined : newButton}
      />

      {/* Filtre visible dès qu'il y a de quoi filtrer : sinon, l'écran vide suffit. */}
      {(!empty || !!archivedWarehouses.data?.length) && (
        <div className="mt-8 flex">
          <StatusFilter value={status} onChange={list.setStatus} />
        </div>
      )}

      <div className="mt-6">
        {warehouses.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: SKELETON_CARDS }, (_, index) => (
              <Skeleton key={index} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : warehouses.data?.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {warehouses.data.map((warehouse, index) => (
              <WarehouseCard
                key={warehouse.id}
                warehouse={warehouse}
                index={index}
              />
            ))}
          </ul>
        ) : archived ? (
          <p className="py-10 text-center text-muted-foreground">
            {t("archivedEmpty")}
          </p>
        ) : (
          <EmptyState
            illustration={<DepotScene />}
            title={t("empty.title")}
            description={t("empty.description")}
            action={newButton || undefined}
          />
        )}
      </div>
    </PageBody>
  )
}

function WarehouseCard({
  warehouse,
  index,
}: {
  warehouse: Warehouse
  index: number
}) {
  const t = useTranslations("warehouses")
  const Icon = warehouseKindIcons[warehouse.kind]
  return (
    <li
      className="animate-rise-in"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <Link
        href={RecordRoutes.warehouse(warehouse.id)}
        className="group flex h-full flex-col gap-5 rounded-2xl border p-5 transition-colors hover:border-foreground/20 hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"
            aria-hidden
          >
            <Icon className="size-5" />
          </span>
          {warehouse.status === CatalogStatus.archived ? (
            <Badge variant="secondary">{t("restore.badge")}</Badge>
          ) : (
            <span className="text-xs font-medium text-muted-foreground">
              {t(`kinds.${warehouse.kind}.label`)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{warehouse.name}</h2>
          {warehouse.city && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPinIcon className="size-3.5" aria-hidden />
              <span className="truncate">{warehouse.city}</span>
            </p>
          )}
        </div>
        <p className="mt-auto text-sm font-medium">
          {t("itemCount", { count: warehouse.itemCount })}
        </p>
      </Link>
    </li>
  )
}
