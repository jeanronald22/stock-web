"use client"

import { MapPinIcon, PlusIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { EmptyState } from "@/components/catalog/empty-state"
import { DepotScene } from "@/components/illustrations/depot-scene"
import { usePageTour } from "@/components/tour/tour-provider"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { CatalogStatus, type Warehouse } from "@/lib/api/stock"
import { useWarehouses } from "@/lib/api/stock-queries"
import { RecordRoutes, Routes } from "@/lib/routes"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"

import { warehouseKindIcons } from "./warehouse-kind"

const SKELETON_CARDS = 3

export function WarehousesScreen() {
  const t = useTranslations("warehouses")
  const [status, setStatus] = useState<CatalogStatus>(CatalogStatus.active)
  const warehouses = useWarehouses(status)
  const archived = status === CatalogStatus.archived
  // Sans dépôt, l'action est portée par l'écran vide : pas de second bouton dans l'en-tête.
  const empty =
    warehouses.isSuccess && warehouses.data.length === 0 && !archived
  usePageTour("warehouses", { ready: warehouses.isSuccess })

  const newButton = (
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
        actions={empty ? undefined : newButton}
      />

      <div className="mt-8">
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
            action={newButton}
          />
        )}
      </div>

      <div className="mt-10 text-center">
        <Button
          variant="link"
          onClick={() =>
            setStatus(archived ? CatalogStatus.active : CatalogStatus.archived)
          }
          className="text-muted-foreground"
        >
          {archived ? t("showActive") : t("showArchived")}
        </Button>
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
