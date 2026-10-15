"use client"

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  BellIcon,
  EllipsisVerticalIcon,
  PencilIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useFormatter, useTranslations } from "next-intl"
import { useMemo, useState, type ReactNode } from "react"
import { toast } from "sonner"

import { useCategoryTree } from "@/components/categories/use-category-tree"
import { EmptyState } from "@/components/catalog/empty-state"
import { SearchScene } from "@/components/illustrations/search-scene"
import { StockStateBadge } from "@/components/stock/stock-state-badge"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { VoucherTypeBadge } from "@/components/vouchers/vouchers-screen"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useStockAccess } from "@/components/workspace/stock-access"
import {
  CatalogStatus,
  StockPermission,
  StockState,
  type Item,
  type Warehouse,
} from "@/lib/api/stock"
import { useItem, useItemStatus, useWarehouses } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { useItemStock, useVouchersPage } from "@/lib/api/voucher-queries"
import type { WarehouseStock } from "@/lib/api/vouchers"
import {
  EntryQueryParams,
  ListQueryParams,
  RecordRoutes,
  Routes,
} from "@/lib/routes"
import { cn } from "@/lib/utils"

import {
  useBatchLabel,
  usePackagingBreakdown,
  useQuantityLabel,
} from "./describe"
import { ItemThresholds } from "./item-thresholds"
import { ItemThumb } from "./item-thumb"

/** Derniers bons montrés sur la fiche ; la liste des bons montre le reste. */
const LATEST_VOUCHERS = 8

export function ItemDetailScreen({ id }: { id: string }) {
  const t = useTranslations("items")
  const item = useItem(id)
  // Relue à l'ouverture : un dépôt vient peut-être d'être ajouté.
  const warehouses = useWarehouses(CatalogStatus.active, { fresh: true })

  if (item.isPending || warehouses.isPending) {
    return (
      <PageBody>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-8 h-40 rounded-2xl" />
        <Skeleton className="mt-6 h-64 rounded-2xl" />
      </PageBody>
    )
  }
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
  return <ItemDetails item={item.data} warehouses={warehouses.data ?? []} />
}

/** Un dépôt de la fiche : son stock, son seuil, et ce que cela veut dire. */
type WarehouseLine = {
  warehouse: { id: string; name: string }
  stock: WarehouseStock | undefined
  minQuantity: number | null
  state: StockState
}

/** Même règle que l'API (StockState.of) : surveillé seulement avec un seuil ; zéro, c'est la rupture. */
function stateOf(quantity: number, minQuantity: number | null): StockState {
  if (minQuantity === null) return StockState.ok
  if (quantity === 0) return StockState.out
  return quantity <= minQuantity ? StockState.low : StockState.ok
}

/**
 * Fiche d'un article, en consultation : combien il en reste et où, ce qui a bougé, ce qui le
 * décrit. La modification est un écran à part (« Modifier »).
 */
function ItemDetails({
  item,
  warehouses,
}: {
  item: Item
  warehouses: Warehouse[]
}) {
  const t = useTranslations()
  const { can, covers } = useStockAccess()
  const manages = can(StockPermission.manageCatalog)
  const archived = item.status === CatalogStatus.archived
  const stock = useItemStock(item.id)
  const { nodes } = useCategoryTree()
  const category = nodes.find((node) => node.category.id === item.categoryId)

  // Les dépôts où l'article est proposé, et ceux où il reste du stock sans y être proposé.
  const lines: WarehouseLine[] = useMemo(() => {
    const entries = stock.data?.warehouses ?? []
    // Le nom vient du stock (même d'un dépôt archivé), sinon de la liste des dépôts.
    const names = new Map([
      ...warehouses.map((warehouse) => [warehouse.id, warehouse.name] as const),
      ...entries.map(
        (entry) => [entry.warehouse.id, entry.warehouse.name] as const
      ),
    ])
    const ids = new Set([
      ...item.warehouses.map((placement) => placement.warehouseId),
      ...entries.map((entry) => entry.warehouse.id),
    ])
    return [...ids]
      .filter((id) => names.has(id) && covers(id))
      .map((id) => ({ id, name: names.get(id)! }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((warehouse) => {
        const entry = entries.find(
          (candidate) => candidate.warehouse.id === warehouse.id
        )
        const minQuantity =
          item.warehouses.find(
            (placement) => placement.warehouseId === warehouse.id
          )?.minQuantity ?? null
        return {
          warehouse,
          stock: entry,
          minQuantity,
          state: stateOf(entry?.quantity ?? 0, minQuantity),
        }
      })
  }, [stock.data, item.warehouses, warehouses, covers])
  const total = lines.reduce(
    (sum, line) => sum + (line.stock?.quantity ?? 0),
    0
  )

  return (
    <PageBody>
      <PageHeader
        title={item.name}
        breadcrumbs={[
          { label: t("items.title"), href: Routes.items },
          { label: item.name },
        ]}
        description={category?.path}
        actions={
          <>
            {archived && (
              <Badge variant="secondary">{t("items.restore.badge")}</Badge>
            )}
            {manages && (
              <Link
                href={RecordRoutes.itemEdit(item.id)}
                className={buttonVariants()}
              >
                <PencilIcon />
                {t("items.detail.edit")}
              </Link>
            )}
            <ItemMenu item={item} manages={manages} archived={archived} />
          </>
        }
      />

      <StockSummary item={item} total={total} loaded={stock.isSuccess} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-8">
          <WarehouseStock item={item} lines={lines} warehouses={warehouses} />
          <ItemHistory item={item} />
        </div>
        <ItemFacts item={item} />
      </div>
    </PageBody>
  )
}

/**
 * Le chiffre qui compte, en grand : le stock de ses dépôts, dit aussi en conditionnements, à côté de
 * la photo qui permet de reconnaître l'article dans les rayons.
 */
function StockSummary({
  item,
  total,
  loaded,
}: {
  item: Item
  total: number
  loaded: boolean
}) {
  const t = useTranslations("items.detail")
  const tUnits = useTranslations("units")
  const breakdown = usePackagingBreakdown()(item, total)
  const format = useFormatter()
  return (
    <section
      aria-labelledby="item-stock-title"
      className="mt-8 flex items-center gap-4 rounded-2xl border bg-muted/30 p-4 sm:gap-8 sm:p-5"
    >
      {/* Téléphone : la photo reste à côté du chiffre, qui doit se lire sans faire défiler. */}
      <ItemThumb
        imageUrl={item.imageUrl}
        size="xl"
        className="size-16 rounded-xl sm:size-28 sm:rounded-2xl [&_svg]:size-7 sm:[&_svg]:size-10"
      />
      <div className="min-w-0">
        <h2 id="item-stock-title" className="text-sm text-muted-foreground">
          {t("inStock")}
        </h2>
        {loaded ? (
          <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
              {format.number(total)}
            </span>
            <span className="text-lg text-muted-foreground">
              {tUnits(`${item.baseUnit}.unitPlural`, { count: total })}
            </span>
          </p>
        ) : (
          <Skeleton className="mt-2 h-12 w-40" />
        )}
        {breakdown && (
          <p className="mt-1 text-muted-foreground tabular-nums">
            {t("breakdown", { breakdown })}
          </p>
        )}
      </div>
    </section>
  )
}

/** Dépôt par dépôt : stock, seuil d'alerte et état ; lots avec leur nuance. */
function WarehouseStock({
  item,
  lines,
  warehouses,
}: {
  item: Item
  lines: WarehouseLine[]
  warehouses: Warehouse[]
}) {
  const t = useTranslations("items.detail")
  const quantityLabel = useQuantityLabel()
  const batchLabel = useBatchLabel()
  const canSetThresholds = useStockAccess().can(StockPermission.setThresholds)
  const [thresholds, setThresholds] = useState(false)

  return (
    <section aria-labelledby="item-warehouses-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="item-warehouses-title" className="text-lg font-semibold">
          {t("byWarehouse")}
        </h2>
        {canSetThresholds && item.warehouses.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setThresholds(true)}
          >
            <BellIcon />
            {t("thresholds")}
          </Button>
        )}
      </div>
      {lines.length === 0 ? (
        <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          {t("noWarehouse")}
        </p>
      ) : (
        <ul className="divide-y rounded-2xl border">
          {lines.map((line) => (
            <li
              key={line.warehouse.id}
              className="flex flex-wrap items-start gap-x-4 gap-y-2 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{line.warehouse.name}</p>
                  <StockStateBadge state={line.state} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {line.minQuantity === null
                    ? t("noThreshold")
                    : t("threshold", {
                        quantity: quantityLabel(
                          item.baseUnit,
                          line.minQuantity
                        ),
                      })}
                </p>
                {(line.stock?.batches.length ?? 0) > 0 && (
                  <ul
                    className="mt-2 flex flex-wrap gap-1"
                    aria-label={t("batches")}
                  >
                    {line.stock!.batches.map((batch) => (
                      <li key={batch.batch}>
                        <Badge variant="outline" className="font-normal">
                          {batchLabel(batch.batch ?? "", batch)} ·{" "}
                          {quantityLabel(item.baseUnit, batch.quantity)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p
                className={cn(
                  "text-xl font-semibold tabular-nums",
                  line.state === StockState.out && "text-destructive"
                )}
              >
                {quantityLabel(item.baseUnit, line.stock?.quantity ?? 0)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <Sheet open={thresholds} onOpenChange={setThresholds}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>{t("thresholds")}</SheetTitle>
            <SheetDescription>{t("thresholdsHint")}</SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <ItemThresholds item={item} warehouses={warehouses} bare />
          </div>
        </SheetContent>
      </Sheet>
    </section>
  )
}

/** Ce qui a bougé : les derniers bons qui portent l'article, avec son mouvement sur chacun. */
function ItemHistory({ item }: { item: Item }) {
  const t = useTranslations("items.detail")
  const format = useFormatter()
  const quantityLabel = useQuantityLabel()
  const search = useMemo(() => ({ itemId: item.id }), [item.id])
  const vouchers = useVouchersPage(search, 0, LATEST_VOUCHERS)
  const rows = vouchers.data?.items ?? []
  const total = vouchers.data?.total ?? 0

  return (
    <section aria-labelledby="item-history-title">
      <h2 id="item-history-title" className="mb-3 text-lg font-semibold">
        {t("history")}
      </h2>
      {vouchers.isPending ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          {t("noHistory")}
        </p>
      ) : (
        <>
          <ul className="divide-y rounded-2xl border">
            {rows.map((voucher) => {
              const movement = voucher.itemMovement ?? 0
              return (
                <li key={voucher.id}>
                  <Link
                    href={RecordRoutes.voucher(voucher.id)}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 transition-colors hover:bg-muted/40"
                  >
                    <span className="font-mono font-semibold">
                      {voucher.number}
                    </span>
                    <VoucherTypeBadge type={voucher.type} />
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                      {format.dateTime(new Date(voucher.occurredAt), {
                        dateStyle: "medium",
                      })}
                      {" · "}
                      {voucher.warehouse.name}
                      {voucher.counterparty && ` · ${voucher.counterparty}`}
                    </span>
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        movement > 0 && "text-success-muted-foreground"
                      )}
                    >
                      {movement === 0
                        ? t("unchanged")
                        : `${movement > 0 ? "+" : "−"} ${quantityLabel(item.baseUnit, Math.abs(movement))}`}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
          {total > rows.length && (
            <Link
              href={`${Routes.vouchers}?${ListQueryParams.item}=${item.id}`}
              className={cn(buttonVariants({ variant: "outline" }), "mt-3")}
            >
              {t("allHistory", { count: total })}
            </Link>
          )}
        </>
      )}
    </section>
  )
}

/** Ce qui décrit l'article : de quoi le reconnaître et le compter. */
function ItemFacts({ item }: { item: Item }) {
  const t = useTranslations()
  const quantityLabel = useQuantityLabel()
  const facts: { label: string; value: ReactNode }[] = [
    { label: t("items.detail.unit"), value: t(`units.${item.baseUnit}.label`) },
    ...(item.packagings.length > 0
      ? [
          {
            label: t("items.detail.packagings"),
            value: (
              <ul>
                {item.packagings.map((packaging) => (
                  <li key={packaging.name}>
                    {packaging.name} ={" "}
                    {quantityLabel(item.baseUnit, packaging.quantity)}
                  </li>
                ))}
              </ul>
            ),
          },
        ]
      : []),
    {
      label: t("items.detail.batchTracking"),
      value: item.batchTracking
        ? t("items.detail.byBatch")
        : t("items.detail.noBatch"),
    },
    ...(item.reference
      ? [
          {
            label: t("items.detail.reference"),
            value: <span className="font-mono">{item.reference}</span>,
          },
        ]
      : []),
    ...(item.barcode
      ? [
          {
            label: t("items.detail.barcode"),
            value: <span className="font-mono">{item.barcode}</span>,
          },
        ]
      : []),
  ]
  return (
    <aside
      aria-labelledby="item-facts-title"
      className="rounded-2xl border p-5 lg:sticky lg:top-20"
    >
      <h2 id="item-facts-title" className="text-lg font-semibold">
        {t("items.detail.facts")}
      </h2>
      <dl className="mt-3 space-y-3">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-sm text-muted-foreground">{fact.label}</dt>
            <dd className="mt-0.5 font-medium">{fact.value}</dd>
          </div>
        ))}
      </dl>
      {item.description && (
        <p className="mt-4 border-t pt-4 text-sm whitespace-pre-line text-muted-foreground">
          {item.description}
        </p>
      )}
    </aside>
  )
}

/**
 * Le reste des actions : commencer un bon avec l'article déjà dessus, et, pour qui gère le
 * catalogue, archiver ou restaurer (avec confirmation pour archiver).
 */
function ItemMenu({
  item,
  manages,
  archived,
}: {
  item: Item
  manages: boolean
  archived: boolean
}) {
  const t = useTranslations()
  const router = useRouter()
  const errorMessage = useErrorMessage()
  const status = useItemStatus()
  const records = useStockAccess().can(StockPermission.recordMovements)
  const [confirming, setConfirming] = useState(false)
  if (!records && !manages) return null

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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              aria-label={t("items.detail.more")}
            />
          }
        >
          <EllipsisVerticalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {records && !archived && (
            <>
              <DropdownMenuItem
                onClick={() => router.push(withItem(Routes.newReceipt))}
              >
                <ArrowDownToLineIcon />
                {t("items.detail.receive")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(withItem(Routes.newIssue))}
              >
                <ArrowUpFromLineIcon />
                {t("items.detail.issue")}
              </DropdownMenuItem>
            </>
          )}
          {manages && records && !archived && <DropdownMenuSeparator />}
          {manages &&
            (archived ? (
              <DropdownMenuItem
                onClick={() => changeStatus(CatalogStatus.active)}
              >
                <ArchiveRestoreIcon />
                {t("items.restore.action")}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirming(true)}
              >
                <ArchiveIcon />
                {t("items.archive.action")}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("items.archive.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("items.archive.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogCancel
              variant="destructive"
              onClick={() => changeStatus(CatalogStatus.archived)}
            >
              {t("items.archive.action")}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
