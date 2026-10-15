"use client"

import {
  ArrowDownToLineIcon,
  ArrowRightLeftIcon,
  ArrowUpFromLineIcon,
} from "lucide-react"
import Link from "next/link"
import { useFormatter, useTranslations } from "next-intl"
import { useMemo } from "react"
import { toast } from "sonner"

import { useQuantityLabel } from "@/components/items/describe"
import { WarehouseLocations } from "@/components/locations/warehouse-locations"
import { ItemThumb } from "@/components/items/item-thumb"
import { RecordActions } from "@/components/records/record-actions"
import { RecordFacts } from "@/components/records/record-facts"
import {
  RecordNotFound,
  RecordSkeleton,
} from "@/components/records/record-states"
import { VoucherHistory } from "@/components/records/voucher-history"
import { StockStateBadge } from "@/components/stock/stock-state-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useStockAccess } from "@/components/workspace/stock-access"
import {
  CatalogStatus,
  StockPermission,
  StockState,
  type Warehouse,
} from "@/lib/api/stock"
import { useWarehouse, useWarehouseStatus } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { useStockPage } from "@/lib/api/voucher-queries"
import type { StockRow } from "@/lib/api/vouchers"
import {
  EntryQueryParams,
  ListQueryParams,
  RecordRoutes,
  Routes,
  StockAlertParam,
} from "@/lib/routes"
import { cn } from "@/lib/utils"

import { warehouseKindIcons } from "./warehouse-kind"

/** Articles à commander montrés sur la fiche ; le stock filtré montre le reste. */
const TO_ORDER_PREVIEW = 5
const ALERT_STATES = [StockState.low, StockState.out]

export function WarehouseDetailScreen({ id }: { id: string }) {
  const t = useTranslations("warehouses")
  const warehouse = useWarehouse(id)
  if (warehouse.isPending) return <RecordSkeleton />
  if (!warehouse.data)
    return (
      <RecordNotFound
        title={t("notFound")}
        listLabel={t("title")}
        listHref={Routes.warehouses}
      />
    )
  return <WarehouseDetails warehouse={warehouse.data} />
}

/**
 * Fiche d'un dépôt, en consultation : ce qu'il propose, ce qui manque, ce qui a bougé. La
 * modification est un écran à part (« Modifier »).
 */
function WarehouseDetails({ warehouse }: { warehouse: Warehouse }) {
  const t = useTranslations()
  const archived = warehouse.status === CatalogStatus.archived
  const toOrderSearch = useMemo(
    () => ({ warehouseIds: [warehouse.id], stockStates: ALERT_STATES }),
    [warehouse.id]
  )
  const toOrder = useStockPage(toOrderSearch, 0, TO_ORDER_PREVIEW)
  const historySearch = useMemo(
    () => ({ warehouseIds: [warehouse.id] }),
    [warehouse.id]
  )

  return (
    <PageBody>
      <PageHeader
        title={warehouse.name}
        breadcrumbs={[
          { label: t("warehouses.title"), href: Routes.warehouses },
          { label: warehouse.name },
        ]}
        description={[
          t(`warehouses.kinds.${warehouse.kind}.label`),
          warehouse.city,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            {archived && (
              <Badge variant="secondary">{t("warehouses.restore.badge")}</Badge>
            )}
            <WarehouseActions warehouse={warehouse} archived={archived} />
          </>
        }
      />

      <WarehouseSummary warehouse={warehouse} toOrder={toOrder.data?.total} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-8">
          <ToOrder
            warehouse={warehouse}
            rows={toOrder.data?.items}
            total={toOrder.data?.total ?? 0}
          />
          <WarehouseLocations warehouse={warehouse} />
          <VoucherHistory
            title={t("warehouses.detail.history")}
            search={historySearch}
            empty={t("warehouses.detail.noHistory")}
            allHref={`${Routes.vouchers}?${ListQueryParams.warehouse}=${warehouse.id}`}
            detail={(voucher) =>
              voucher.counterparty && (
                <span className="truncate text-sm">{voucher.counterparty}</span>
              )
            }
          />
        </div>
        <RecordFacts
          title={t("warehouses.detail.facts")}
          facts={[
            {
              label: t("warehouses.detail.kind"),
              value: t(`warehouses.kinds.${warehouse.kind}.label`),
            },
            warehouse.city && {
              label: t("warehouses.detail.city"),
              value: warehouse.city,
            },
            warehouse.address && {
              label: t("warehouses.detail.address"),
              value: warehouse.address,
            },
          ]}
        />
      </div>
    </PageBody>
  )
}

/**
 * Le chiffre du dépôt, en grand : les articles qu'il propose ; à côté, ce qui est à commander, la
 * seule chose qui demande d'agir.
 */
function WarehouseSummary({
  warehouse,
  toOrder,
}: {
  warehouse: Warehouse
  toOrder: number | undefined
}) {
  const t = useTranslations("warehouses.detail")
  const format = useFormatter()
  const Icon = warehouseKindIcons[warehouse.kind]
  return (
    <section
      aria-label={t("summary")}
      className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl border bg-muted/30 p-4 sm:p-5"
    >
      <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-20 sm:rounded-2xl">
        <Icon className="size-7 sm:size-9" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{t("offered")}</p>
        <p className="mt-1 flex items-baseline gap-3">
          <span className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
            {format.number(warehouse.itemCount)}
          </span>
          <span className="text-lg text-muted-foreground">
            {t("items", { count: warehouse.itemCount })}
          </span>
        </p>
        {warehouse.itemCount > 0 && (
          <Link
            href={`${Routes.items}?${ListQueryParams.warehouse}=${warehouse.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("seeItems")}
          </Link>
        )}
      </div>
      {toOrder === undefined ? (
        <Skeleton className="h-10 w-40" />
      ) : toOrder > 0 ? (
        <Link
          href={`${Routes.stock}?${ListQueryParams.warehouse}=${warehouse.id}&${ListQueryParams.stockAlert}=${StockAlertParam.any}`}
          className="rounded-xl border border-warning/40 bg-warning-muted/60 px-4 py-2 font-semibold text-warning-muted-foreground transition-colors hover:bg-warning-muted"
        >
          {t("toOrderCount", { count: toOrder })}
        </Link>
      ) : (
        <p className="text-sm text-muted-foreground">{t("nothingToOrder")}</p>
      )}
    </section>
  )
}

/** Ce qui manque dans ce dépôt : au seuil ou en rupture, rupture d'abord. */
function ToOrder({
  warehouse,
  rows,
  total,
}: {
  warehouse: Warehouse
  rows: StockRow[] | undefined
  total: number
}) {
  const t = useTranslations("warehouses.detail")
  const quantityLabel = useQuantityLabel()
  if (!rows || rows.length === 0) return null
  return (
    <section aria-label={t("toOrder")}>
      <h2 className="mb-3 text-lg font-semibold">{t("toOrder")}</h2>
      <ul className="divide-y rounded-2xl border">
        {rows.map((row) => {
          const alert = row.alerts.find(
            (candidate) => candidate.warehouse.id === warehouse.id
          )
          return (
            <li key={row.item.id}>
              <Link
                href={RecordRoutes.item(row.item.id)}
                className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/40"
              >
                <ItemThumb imageUrl={row.item.imageUrl} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {row.item.name}
                  </span>
                  {alert && (
                    <span className="block text-sm text-muted-foreground">
                      {t("threshold", {
                        quantity: quantityLabel(
                          row.item.baseUnit,
                          alert.minQuantity
                        ),
                      })}
                    </span>
                  )}
                </span>
                <StockStateBadge state={row.state} />
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    row.state === StockState.out && "text-destructive"
                  )}
                >
                  {quantityLabel(row.item.baseUnit, row.quantity)}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
      {total > rows.length && (
        <Link
          href={`${Routes.stock}?${ListQueryParams.warehouse}=${warehouse.id}&${ListQueryParams.stockAlert}=${StockAlertParam.any}`}
          className={cn(buttonVariants({ variant: "outline" }), "mt-3")}
        >
          {t("allToOrder", { count: total })}
        </Link>
      )}
    </section>
  )
}

/** Modifier (gérant), commencer un bon depuis ce dépôt, archiver ou restaurer. */
function WarehouseActions({
  warehouse,
  archived,
}: {
  warehouse: Warehouse
  archived: boolean
}) {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const status = useWarehouseStatus()
  const { can, covers } = useStockAccess()
  const manages = can(StockPermission.manageWarehouses)
  const records =
    can(StockPermission.recordMovements) && covers(warehouse.id) && !archived
  const here = (route: string) =>
    `${route}?${EntryQueryParams.warehouse}=${warehouse.id}`
  const changeStatus = (target: CatalogStatus) =>
    status.mutate(
      { id: warehouse.id, status: target },
      {
        onSuccess: () =>
          toast.success(
            target === CatalogStatus.archived
              ? t("warehouses.archive.done")
              : t("warehouses.restore.done")
          ),
        onError: (error) => toast.error(errorMessage(error)),
      }
    )
  return (
    <RecordActions
      editHref={manages ? RecordRoutes.warehouseEdit(warehouse.id) : undefined}
      actions={
        records
          ? [
              {
                icon: ArrowDownToLineIcon,
                label: t("warehouses.detail.receive"),
                href: here(Routes.newReceipt),
              },
              {
                icon: ArrowUpFromLineIcon,
                label: t("warehouses.detail.issue"),
                href: here(Routes.newIssue),
              },
              {
                icon: ArrowRightLeftIcon,
                label: t("warehouses.detail.transfer"),
                href: here(Routes.newTransfer),
              },
            ]
          : []
      }
      archive={
        manages
          ? {
              archived,
              labels: {
                action: t("warehouses.archive.action"),
                title: t("warehouses.archive.title"),
                description: t("warehouses.archive.description"),
                restore: t("warehouses.restore.action"),
              },
              onArchive: () => changeStatus(CatalogStatus.archived),
              onRestore: () => changeStatus(CatalogStatus.active),
            }
          : undefined
      }
    />
  )
}
