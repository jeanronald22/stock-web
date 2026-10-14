"use client"

import { PlusIcon, SearchIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { CategoriesSheet } from "@/components/categories/categories-sheet"
import { useCategoryTree } from "@/components/categories/use-category-tree"
import { CategoryFilter } from "@/components/catalog/category-filter"
import { ClearFilters } from "@/components/catalog/clear-filters"
import { EmptyState } from "@/components/catalog/empty-state"
import { StatusFilter } from "@/components/catalog/status-filter"
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
import { STOCK_ALERT_STATES, useListParams } from "@/lib/list/use-list-params"
import { ListQueryParams, Routes } from "@/lib/routes"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"
import { useStockAccess } from "@/components/workspace/stock-access"

import { ItemsTable, ItemsTableSkeleton } from "./items-table"

/** La recherche part quand la frappe se pose, pas à chaque lettre. */
const SEARCH_DELAY_MS = 300
const SKELETON_ROWS = 8

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
  } = list.params
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
  const search = useMemo(
    () => ({
      text: text || undefined,
      warehouseIds,
      categoryId,
      supplierId,
      stockStates: stockAlert && STOCK_ALERT_STATES[stockAlert],
      status,
    }),
    [text, warehouseIds, categoryId, supplierId, stockAlert, status]
  )
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
          catalogEmpty || !manages ? undefined : (
            <div className="flex flex-wrap gap-2">
              <CategoriesSheet />
              {newButton}
            </div>
          )
        }
      />

      {catalogEmpty ? (
        <EmptyState
          illustration={<CatalogScene />}
          title={t("empty.title")}
          description={t("empty.description")}
          action={newButton || undefined}
        />
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <InputGroup
              className="sm:max-w-md sm:min-w-64 sm:flex-1"
              {...tourAnchor(TourAnchors.itemSearch)}
            >
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
            <WarehouseFilter
              value={warehouseIds}
              onChange={list.setWarehouses}
              {...tourAnchor(TourAnchors.itemWarehouseFilter)}
            />
            <CategoryFilter value={categoryId} onChange={list.setCategory} />
            <SupplierFilter value={supplierId} onChange={list.setSupplier} />
            <StockAlertFilter
              value={stockAlert}
              onChange={list.setStockAlert}
            />
            <StatusFilter value={status} onChange={list.setStatus} />
            <ClearFilters
              visible={filtered}
              onClear={() => {
                setTyped("")
                list.reset()
              }}
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border">
            {items.isPending ? (
              <ItemsTableSkeleton rows={SKELETON_ROWS} />
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
                <ItemsTable
                  items={items.data?.items ?? []}
                  warehouseNames={warehouseNames}
                  categoryPaths={categories.paths}
                  stale={items.isPlaceholderData}
                />
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
