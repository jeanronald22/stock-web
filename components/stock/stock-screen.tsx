"use client"

import { SearchIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { CategoryFilter } from "@/components/catalog/category-filter"
import { EmptyState } from "@/components/catalog/empty-state"
import { FilterBar } from "@/components/catalog/filter-bar"
import { TablePagination } from "@/components/catalog/table-pagination"
import { ViewToggle } from "@/components/catalog/view-toggle"
import { WarehouseFilter } from "@/components/catalog/warehouse-filter"
import { useCategoryTree } from "@/components/categories/use-category-tree"
import { SearchScene } from "@/components/illustrations/search-scene"
import { ShelfScene } from "@/components/illustrations/shelf-scene"
import { OpenInventories } from "@/components/inventory/open-inventories"
import { ItemGridSkeleton } from "@/components/items/item-card"
import { ItemsTableSkeleton } from "@/components/items/items-table"
import { usePageTour } from "@/components/tour/tour-provider"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { NewVoucherButtons } from "@/components/vouchers/new-voucher-buttons"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useStockPage } from "@/lib/api/voucher-queries"
import {
  ListView,
  STOCK_ALERT_STATES,
  useListParams,
  type ListParamKey,
} from "@/lib/list/use-list-params"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"
import { cn } from "@/lib/utils"

import { StockGrid } from "./stock-grid"
import { StockLevelTabs } from "./stock-level-tabs"
import { StockMoreMenu } from "./stock-more-menu"
import { StockTable } from "./stock-table"

const SEARCH_DELAY_MS = 300
const SKELETON_ROWS = 8
/** Le niveau de stock est en onglets : il ne compte pas dans « Filtres ». */
const OUTSIDE_MENU: readonly ListParamKey[] = ["stockAlert"]

/**
 * Stock par article, cumulé sur les dépôts filtrés (ou tous). Les alertes viennent des seuils de
 * chaque dépôt : « Stock bas » au seuil ou en dessous, « Rupture » à zéro.
 */
export function StockScreen() {
  const t = useTranslations("stock")
  const list = useListParams()
  const categories = useCategoryTree()
  const { text, warehouseIds, categoryId, stockAlert, page, size, view } =
    list.params
  const grid = view === ListView.grid
  const [typed, setTyped] = useState(text)
  const { setText } = list
  useEffect(() => {
    if (typed.trim() === text) return
    const timer = window.setTimeout(() => setText(typed), SEARCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [typed, text, setText])

  const scope = useMemo(
    () => ({ text: text || undefined, warehouseIds, categoryId }),
    [text, warehouseIds, categoryId]
  )
  const search = useMemo(
    () => ({
      ...scope,
      stockStates: stockAlert && STOCK_ALERT_STATES[stockAlert],
    }),
    [scope, stockAlert]
  )
  const stock = useStockPage(search, page, size)
  const total = stock.data?.total ?? 0
  const rows = stock.data?.items ?? []
  const empty = stock.isSuccess && total === 0 && !list.filtered
  usePageTour("stock", { ready: stock.isSuccess })
  const reset = () => {
    setTyped("")
    list.reset()
  }

  return (
    <PageBody>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex w-full gap-2 sm:w-auto">
            <NewVoucherButtons />
            <StockMoreMenu search={search} canExport={!empty} />
          </div>
        }
      />
      <OpenInventories />
      {empty ? (
        <EmptyState
          illustration={<ShelfScene />}
          title={t("empty.title")}
          description={t("empty.description")}
        />
      ) : (
        <>
          <StockLevelTabs
            search={scope}
            value={stockAlert}
            onChange={list.setStockAlert}
          />
          <FilterBar
            {...tourAnchor(TourAnchors.stockFilters)}
            className="mt-3"
            activeCount={list.countFilters(OUTSIDE_MENU)}
            onClear={reset}
            lead={
              <InputGroup>
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
            }
            trailing={<ViewToggle value={view} onChange={list.setView} />}
          >
            <WarehouseFilter
              value={warehouseIds}
              onChange={list.setWarehouses}
            />
            <CategoryFilter value={categoryId} onChange={list.setCategory} />
          </FilterBar>
          <div
            className={cn("mt-4", !grid && "overflow-hidden rounded-xl border")}
          >
            {stock.isPending ? (
              grid ? (
                <ItemGridSkeleton cards={SKELETON_ROWS} />
              ) : (
                <ItemsTableSkeleton rows={SKELETON_ROWS} />
              )
            ) : total === 0 ? (
              <EmptyState
                illustration={<SearchScene />}
                title={t("noResult.title")}
                description={t("noResult.description")}
                action={
                  <Button variant="outline" onClick={reset}>
                    {t("noResult.reset")}
                  </Button>
                }
              />
            ) : (
              <>
                {grid ? (
                  <StockGrid
                    rows={rows}
                    categoryPaths={categories.paths}
                    stale={stock.isPlaceholderData}
                  />
                ) : (
                  <StockTable
                    rows={rows}
                    categoryPaths={categories.paths}
                    stale={stock.isPlaceholderData}
                  />
                )}
                <TablePagination
                  detached={grid}
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
