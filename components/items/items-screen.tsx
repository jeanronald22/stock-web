"use client"

import { PlusIcon, SearchIcon, WarehouseIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { EmptyState } from "@/components/catalog/empty-state"
import { TablePagination } from "@/components/catalog/table-pagination"
import { CatalogScene } from "@/components/illustrations/catalog-scene"
import { SearchScene } from "@/components/illustrations/search-scene"
import { usePageTour } from "@/components/tour/tour-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { CatalogStatus } from "@/lib/api/stock"
import { useItemsPage, useWarehouses } from "@/lib/api/stock-queries"
import { useListParams } from "@/lib/list/use-list-params"
import { ListQueryParams, Routes } from "@/lib/routes"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"

import { ItemsTable, ItemsTableSkeleton } from "./items-table"

/** Valeur du filtre « Tous les dépôts » (aucun identifiant de dépôt ne peut la prendre). */
const ALL_WAREHOUSES = "all"
/** La recherche part quand la frappe se pose, pas à chaque lettre. */
const SEARCH_DELAY_MS = 300
const SKELETON_ROWS = 8

export function ItemsScreen() {
  const t = useTranslations("items")
  const list = useListParams()
  const { text, warehouseId, page, size } = list.params
  const [typed, setTyped] = useState(text)
  const [status, setStatus] = useState<CatalogStatus>(CatalogStatus.active)
  const archived = status === CatalogStatus.archived

  const { setText } = list
  useEffect(() => {
    if (typed.trim() === text) return
    const timer = window.setTimeout(() => setText(typed), SEARCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [typed, text, setText])

  const warehouses = useWarehouses()
  const search = useMemo(
    () => ({ text: text || undefined, warehouseId, status }),
    [text, warehouseId, status]
  )
  const items = useItemsPage(search, page, size)
  const total = items.data?.total ?? 0
  const filtered = !!text || !!warehouseId
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
  const warehouseOptions = [
    { value: ALL_WAREHOUSES, label: t("allWarehouses") },
    ...(warehouses.data ?? []).map((warehouse) => ({
      value: warehouse.id,
      label: warehouse.name,
    })),
  ]
  const newHref = warehouseId
    ? `${Routes.newItem}?${ListQueryParams.warehouse}=${warehouseId}`
    : Routes.newItem
  const newButton = (
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
        actions={catalogEmpty ? undefined : newButton}
      />

      {catalogEmpty ? (
        <EmptyState
          illustration={<CatalogScene />}
          title={t("empty.title")}
          description={t("empty.description")}
          action={newButton}
        />
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <InputGroup
              className="sm:max-w-md sm:flex-1"
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
            <Select
              items={warehouseOptions}
              value={warehouseId ?? ALL_WAREHOUSES}
              onValueChange={(value) =>
                list.setWarehouse(
                  !value || value === ALL_WAREHOUSES ? undefined : value
                )
              }
            >
              <SelectTrigger
                className="w-full sm:w-64"
                aria-label={t("allWarehouses")}
                {...tourAnchor(TourAnchors.itemWarehouseFilter)}
              >
                <WarehouseIcon
                  className="size-5 text-muted-foreground"
                  aria-hidden
                />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {warehouseOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      <div className="mt-10 text-center">
        <Button
          variant="link"
          className="text-muted-foreground"
          onClick={() =>
            setStatus(archived ? CatalogStatus.active : CatalogStatus.archived)
          }
        >
          {archived ? t("showActive") : t("showArchived")}
        </Button>
      </div>
    </PageBody>
  )
}
