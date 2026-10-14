"use client"

import { SearchIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { useCategoryTree } from "@/components/categories/use-category-tree"
import { CategoryFilter } from "@/components/catalog/category-filter"
import { ClearFilters } from "@/components/catalog/clear-filters"
import { EmptyState } from "@/components/catalog/empty-state"
import { StockAlertFilter } from "@/components/catalog/stock-alert-filter"
import { TablePagination } from "@/components/catalog/table-pagination"
import { WarehouseFilter } from "@/components/catalog/warehouse-filter"
import { ShelfScene } from "@/components/illustrations/shelf-scene"
import { SearchScene } from "@/components/illustrations/search-scene"
import { ItemThumb } from "@/components/items/item-thumb"
import { useQuantityLabel } from "@/components/items/describe"
import { ItemsTableSkeleton } from "@/components/items/items-table"
import { usePageTour } from "@/components/tour/tour-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { NewVoucherButtons } from "@/components/vouchers/vouchers-screen"

import { StockStateBadge } from "./stock-state-badge"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { StockState } from "@/lib/api/stock"
import { useStockPage } from "@/lib/api/voucher-queries"
import type { StockRow } from "@/lib/api/vouchers"
import { STOCK_ALERT_STATES, useListParams } from "@/lib/list/use-list-params"
import { RecordRoutes } from "@/lib/routes"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"
import { cn } from "@/lib/utils"

const SEARCH_DELAY_MS = 300
const SKELETON_ROWS = 8

/**
 * Stock par article, cumulé sur les dépôts filtrés (ou tous). Les alertes viennent des seuils de
 * chaque dépôt : « Stock bas » au seuil ou en dessous, « Rupture » à zéro.
 */
export function StockScreen() {
  const t = useTranslations("stock")
  const quantityLabel = useQuantityLabel()
  const list = useListParams()
  const categories = useCategoryTree()
  const { text, warehouseIds, categoryId, stockAlert, page, size } = list.params
  const [typed, setTyped] = useState(text)
  const { setText } = list
  useEffect(() => {
    if (typed.trim() === text) return
    const timer = window.setTimeout(() => setText(typed), SEARCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [typed, text, setText])

  const search = useMemo(
    () => ({
      text: text || undefined,
      warehouseIds,
      categoryId,
      stockStates: stockAlert && STOCK_ALERT_STATES[stockAlert],
    }),
    [text, warehouseIds, categoryId, stockAlert]
  )
  const stock = useStockPage(search, page, size)
  const total = stock.data?.total ?? 0
  const empty = stock.isSuccess && total === 0 && !list.filtered
  usePageTour("stock", { ready: stock.isSuccess })

  return (
    <PageBody>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<NewVoucherButtons />}
      />
      {empty ? (
        <EmptyState
          illustration={<ShelfScene />}
          title={t("empty.title")}
          description={t("empty.description")}
        />
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <InputGroup className="sm:max-w-md sm:min-w-64 sm:flex-1">
              <InputGroupInput
                type="search"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
              />
              <InputGroupAddon>
                {stock.isFetching ? <Spinner /> : <SearchIcon />}
              </InputGroupAddon>
            </InputGroup>
            <WarehouseFilter
              value={warehouseIds}
              onChange={list.setWarehouses}
              {...tourAnchor(TourAnchors.stockWarehouseFilter)}
            />
            <CategoryFilter value={categoryId} onChange={list.setCategory} />
            <StockAlertFilter
              value={stockAlert}
              onChange={list.setStockAlert}
            />
            <ClearFilters
              visible={list.filtered}
              onClear={() => {
                setTyped("")
                list.reset()
              }}
            />
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border">
            {stock.isPending ? (
              <ItemsTableSkeleton rows={SKELETON_ROWS} />
            ) : total === 0 ? (
              <EmptyState
                illustration={<SearchScene />}
                title={t("noResult.title")}
                description={t("noResult.description")}
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTyped("")
                      list.reset()
                    }}
                  >
                    {t("noResult.reset")}
                  </Button>
                }
              />
            ) : (
              <>
                <Table
                  className={cn(
                    "transition-opacity",
                    stock.isPlaceholderData && "opacity-60"
                  )}
                >
                  <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">{t("table.item")}</TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t("table.batches")}
                      </TableHead>
                      <TableHead className="pr-4 text-right">
                        {t("table.quantity")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(stock.data?.items ?? []).map((row) => (
                      <TableRow key={row.item.id} className="relative">
                        <TableCell className="py-3 pl-4 whitespace-normal">
                          <div className="flex items-center gap-3">
                            <ItemThumb imageUrl={row.item.imageUrl} />
                            <div className="min-w-0">
                              <Link
                                href={RecordRoutes.item(row.item.id)}
                                className="truncate font-semibold after:absolute after:inset-0 focus-visible:outline-none"
                              >
                                {row.item.name}
                              </Link>
                              {row.item.reference && (
                                <p className="font-mono text-xs text-muted-foreground">
                                  {row.item.reference}
                                </p>
                              )}
                              {row.item.categoryId && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {categories.paths.get(row.item.categoryId)}
                                </p>
                              )}
                              <StockAlerts row={row} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {row.batches.map((batch) => (
                              <Badge
                                key={batch.batch}
                                variant="outline"
                                className="font-normal"
                              >
                                {batch.batch} ·{" "}
                                {quantityLabel(
                                  row.item.baseUnit,
                                  batch.quantity
                                )}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={cn(
                                "font-semibold tabular-nums",
                                row.quantity === 0 && "text-muted-foreground"
                              )}
                            >
                              {quantityLabel(row.item.baseUnit, row.quantity)}
                            </span>
                            <StockStateBadge state={row.state} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  page={page}
                  size={size}
                  total={total}
                  onPageChange={list.setPage}
                  onSizeChange={list.setSize}
                />
              </>
            )}
          </div>
        </>
      )}
    </PageBody>
  )
}

/** Dépôts en alerte : « Boutique Akwa : 3 pièces, seuil 5 ». */
function StockAlerts({ row }: { row: StockRow }) {
  const t = useTranslations("stock")
  const quantityLabel = useQuantityLabel()
  if (row.alerts.length === 0) return null
  return (
    <ul className="mt-1 space-y-0.5 text-xs">
      {row.alerts.map((alert) => (
        <li
          key={alert.warehouse.id}
          className={cn(
            alert.state === StockState.out
              ? "text-destructive"
              : "text-warning-muted-foreground"
          )}
        >
          {t("alert", {
            warehouse: alert.warehouse.name,
            quantity: quantityLabel(row.item.baseUnit, alert.quantity),
            threshold: quantityLabel(row.item.baseUnit, alert.minQuantity),
          })}
        </li>
      ))}
    </ul>
  )
}
