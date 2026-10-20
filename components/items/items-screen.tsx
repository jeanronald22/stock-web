"use client"

import {
  FileSpreadsheetIcon,
  ListChecksIcon,
  PlusIcon,
  SearchIcon,
  TagIcon,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { CategoriesSheet } from "@/components/categories/categories-sheet"
import { useCategoryTree } from "@/components/categories/use-category-tree"
import { CategoryFilter } from "@/components/catalog/category-filter"
import { ViewToggle } from "@/components/catalog/view-toggle"
import { FilterBar } from "@/components/catalog/filter-bar"
import { EmptyState } from "@/components/catalog/empty-state"
import { StockAlertFilter } from "@/components/catalog/stock-alert-filter"
import { SupplierFilter } from "@/components/catalog/supplier-filter"
import { TablePagination } from "@/components/catalog/table-pagination"
import { WarehouseFilter } from "@/components/catalog/warehouse-filter"
import { CatalogScene } from "@/components/illustrations/catalog-scene"
import { SearchScene } from "@/components/illustrations/search-scene"
import { usePageTour } from "@/components/tour/tour-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { CatalogStatus, StockPermission } from "@/lib/api/stock"
import { useItemsPage, useWarehouses } from "@/lib/api/stock-queries"
import {
  ListView,
  STOCK_ALERT_STATES,
  useListParams,
  type ListParamKey,
} from "@/lib/list/use-list-params"
import { ListQueryParams, Routes } from "@/lib/routes"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"
import { cn } from "@/lib/utils"
import { useStockAccess } from "@/components/workspace/stock-access"

import { ItemGridSkeleton } from "./item-card"
import { ItemSelectionBar, useItemSelection } from "./item-selection"
import { ItemsGrid } from "./items-grid"
import { ItemStatusTabs } from "./item-status-tabs"
import { ItemsMoreMenu } from "./items-more-menu"
import { ItemsTable, ItemsTableSkeleton } from "./items-table"

/** La recherche part quand la frappe se pose, pas à chaque lettre. */
const SEARCH_DELAY_MS = 300
const SKELETON_ROWS = 8
/** Le statut (actifs, archivés) est en onglets : il ne compte pas dans « Filtres ». */
const OUTSIDE_MENU: readonly ListParamKey[] = ["status"]

export function ItemsScreen() {
  const t = useTranslations("items")
  const list = useListParams()
  const {
    text,
    warehouseIds,
    categoryId,
    supplierId,
    stockAlert,
    page,
    size,
    status,
    view,
  } = list.params
  const grid = view === ListView.grid
  const [typed, setTyped] = useState(text)
  const archived = status === CatalogStatus.archived

  const { setText } = list
  useEffect(() => {
    if (typed.trim() === text) return
    const timer = window.setTimeout(() => setText(typed), SEARCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [typed, text, setText])

  const warehouses = useWarehouses()
  const categories = useCategoryTree()
  const scope = useMemo(
    () => ({
      text: text || undefined,
      warehouseIds,
      categoryId,
      supplierId,
      stockStates: stockAlert && STOCK_ALERT_STATES[stockAlert],
    }),
    [text, warehouseIds, categoryId, supplierId, stockAlert]
  )
  const search = useMemo(() => ({ ...scope, status }), [scope, status])
  const items = useItemsPage(search, page, size)
  const total = items.data?.total ?? 0
  const filtered = list.filtered
  const catalogEmpty = items.isSuccess && total === 0 && !filtered && !archived
  usePageTour("items", { ready: items.isSuccess && warehouses.isSuccess })

  // Page devenue vide (articles archivés, filtre plus étroit) : retour à la dernière page existante.
  const { setPage } = list
  const lastPage = Math.max(0, Math.ceil(total / size) - 1)
  useEffect(() => {
    if (items.isSuccess && !items.isPlaceholderData && page > lastPage)
      setPage(lastPage)
  }, [items.isSuccess, items.isPlaceholderData, page, lastPage, setPage])

  const warehouseNames = useMemo(
    () =>
      new Map(
        (warehouses.data ?? []).map((warehouse) => [
          warehouse.id,
          warehouse.name,
        ])
      ),
    [warehouses.data]
  )
  // Un seul dépôt filtré : le nouvel article y est proposé d'office.
  const newHref =
    warehouseIds.length === 1
      ? `${Routes.newItem}?${ListQueryParams.warehouse}=${warehouseIds[0]}`
      : Routes.newItem
  const manages = useStockAccess().can(StockPermission.manageCatalog)
  const choice = useItemSelection()
  const pageItems = items.data?.items ?? []
  const newButton = manages && (
    <Link
      href={newHref}
      className={buttonVariants({ size: "lg" })}
      {...tourAnchor(TourAnchors.newItem)}
    >
      <PlusIcon />
      {t("new")}
    </Link>
  )

  return (
    <PageBody>
      {/* Catalogue vide : l'action est portée par l'écran vide, pas de second bouton. */}
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          catalogEmpty ? undefined : manages ? (
            <div className="flex flex-wrap gap-2">
              <CategoriesSheet />
              <ItemsMoreMenu />
              {newButton}
            </div>
          ) : (
            <Link
              href={Routes.labels}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <TagIcon />
              {t("more.labels")}
            </Link>
          )
        }
      />

      {catalogEmpty ? (
        <EmptyState
          illustration={<CatalogScene />}
          title={t("empty.title")}
          description={t("empty.description")}
          action={
            newButton && (
              <div className="flex flex-col items-center gap-3">
                {newButton}
                {/* Un catalogue tenu dans Excel n'est pas à ressaisir (D36). */}
                <Link
                  href={Routes.importItems}
                  className={buttonVariants({ variant: "ghost" })}
                >
                  <FileSpreadsheetIcon />
                  {t("more.importFromFile")}
                </Link>
              </div>
            )
          }
        />
      ) : (
        <>
          <ItemStatusTabs
            search={scope}
            value={status}
            onChange={list.setStatus}
          />
          <FilterBar
            {...tourAnchor(TourAnchors.itemFilters)}
            className="mt-3"
            activeCount={list.countFilters(OUTSIDE_MENU)}
            onClear={() => {
              setTyped("")
              list.reset()
            }}
            lead={
              <InputGroup {...tourAnchor(TourAnchors.itemSearch)}>
                <InputGroupInput
                  type="search"
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  placeholder={t("searchPlaceholder")}
                  aria-label={t("searchPlaceholder")}
                />
                <InputGroupAddon>
                  {items.isFetching ? <Spinner /> : <SearchIcon />}
                </InputGroupAddon>
              </InputGroup>
            }
            trailing={
              <div className="flex shrink-0 gap-2 sm:order-last sm:ml-auto">
                {/* Choisir des articles pour exporter leurs fiches en PDF. */}
                <Button
                  variant="outline"
                  className="h-11 aria-pressed:border-primary/50 aria-pressed:bg-primary/5 aria-pressed:text-primary sm:h-9"
                  aria-pressed={!!choice.selection}
                  aria-label={t("selection.start")}
                  onClick={choice.selection ? choice.stop : choice.start}
                >
                  <ListChecksIcon />
                  <span className="hidden sm:inline">
                    {t("selection.startShort")}
                  </span>
                </Button>
                <ViewToggle value={view} onChange={list.setView} />
              </div>
            }
          >
            <WarehouseFilter
              value={warehouseIds}
              onChange={list.setWarehouses}
            />
            <CategoryFilter value={categoryId} onChange={list.setCategory} />
            <SupplierFilter value={supplierId} onChange={list.setSupplier} />
            <StockAlertFilter
              value={stockAlert}
              onChange={list.setStockAlert}
            />
          </FilterBar>

          <div
            className={cn("mt-4", !grid && "overflow-hidden rounded-xl border")}
          >
            {items.isPending ? (
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
                  filtered && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTyped("")
                        list.reset()
                      }}
                    >
                      {t("noResult.reset")}
                    </Button>
                  )
                }
              />
            ) : (
              <>
                {grid ? (
                  <ItemsGrid
                    items={pageItems}
                    categoryPaths={categories.paths}
                    stale={items.isPlaceholderData}
                    selection={choice.selection}
                  />
                ) : (
                  <ItemsTable
                    items={pageItems}
                    warehouseNames={warehouseNames}
                    categoryPaths={categories.paths}
                    stale={items.isPlaceholderData}
                    selection={choice.selection}
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
      {choice.selection && (
        <>
          {/* La barre ne couvre pas la pagination. */}
          <div className="h-24" aria-hidden />
          <ItemSelectionBar
            items={choice.items}
            page={pageItems}
            onAddPage={() => choice.addAll(pageItems)}
            onClose={choice.stop}
          />
        </>
      )}
    </PageBody>
  )
}
