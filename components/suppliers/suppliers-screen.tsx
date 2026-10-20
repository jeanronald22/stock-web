"use client"

import { ChevronRightIcon, PlusIcon, SearchIcon, TruckIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { EmptyState } from "@/components/catalog/empty-state"
import { ContactsTabs } from "@/components/customers/contacts-tabs"
import { FilterBar } from "@/components/catalog/filter-bar"
import { StatusFilter } from "@/components/catalog/status-filter"
import { TablePagination } from "@/components/catalog/table-pagination"
import { SearchScene } from "@/components/illustrations/search-scene"
import { TruckScene } from "@/components/illustrations/truck-scene"
import { ItemsTableSkeleton } from "@/components/items/items-table"
import { usePageTour } from "@/components/tour/tour-provider"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { CatalogStatus, StockPermission } from "@/lib/api/stock"
import { useSuppliersPage } from "@/lib/api/supplier-queries"
import { useListParams } from "@/lib/list/use-list-params"
import { RecordRoutes, Routes } from "@/lib/routes"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"
import { cn } from "@/lib/utils"
import { useStockAccess } from "@/components/workspace/stock-access"

const SEARCH_DELAY_MS = 300
const SKELETON_ROWS = 6

export function SuppliersScreen() {
  const t = useTranslations("suppliers")
  const list = useListParams()
  const { text, page, size, status } = list.params
  const [typed, setTyped] = useState(text)
  const { setText } = list
  useEffect(() => {
    if (typed.trim() === text) return
    const timer = window.setTimeout(() => setText(typed), SEARCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [typed, text, setText])

  const search = useMemo(
    () => ({ text: text || undefined, status }),
    [text, status]
  )
  const suppliers = useSuppliersPage(search, page, size)
  const total = suppliers.data?.total ?? 0
  const archived = status === CatalogStatus.archived
  const empty = suppliers.isSuccess && total === 0 && !text && !archived
  usePageTour("suppliers", { ready: suppliers.isSuccess })

  const allowed = useStockAccess().can(StockPermission.manageCatalog)
  const newButton = allowed && (
    <Link
      href={Routes.newSupplier}
      className={buttonVariants({ size: "lg" })}
      {...tourAnchor(TourAnchors.newSupplier)}
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
      <ContactsTabs />
      {empty ? (
        <EmptyState
          illustration={<TruckScene />}
          title={t("empty.title")}
          description={t("empty.description")}
          action={newButton || undefined}
        />
      ) : (
        <>
          <FilterBar
            activeCount={list.countFilters()}
            onClear={() => {
              setTyped("")
              list.reset()
            }}
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
                  {suppliers.isFetching ? <Spinner /> : <SearchIcon />}
                </InputGroupAddon>
              </InputGroup>
            }
          >
            <StatusFilter value={status} onChange={list.setStatus} />
          </FilterBar>
          <div className="mt-6 overflow-hidden rounded-2xl border">
            {suppliers.isPending ? (
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
                    suppliers.isPlaceholderData && "opacity-60"
                  )}
                >
                  <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">{t("table.name")}</TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t("table.contact")}
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        {t("table.items")}
                      </TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(suppliers.data?.items ?? []).map((supplier) => (
                      <TableRow
                        key={supplier.id}
                        className="relative cursor-pointer"
                      >
                        <TableCell className="py-3 pl-4">
                          <div className="flex items-center gap-3">
                            <span
                              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                              aria-hidden
                            >
                              <TruckIcon className="size-4" />
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={RecordRoutes.supplier(supplier.id)}
                                  className="truncate font-semibold after:absolute after:inset-0 focus-visible:outline-none"
                                >
                                  {supplier.name}
                                </Link>
                                {supplier.status === CatalogStatus.archived && (
                                  <Badge variant="secondary">
                                    {t("restore.badge")}
                                  </Badge>
                                )}
                              </div>
                              {/* Petit écran : catalogue et contact sous le nom, leurs colonnes étant masquées. */}
                              <p className="truncate text-xs text-muted-foreground md:hidden">
                                <span className="sm:hidden">
                                  {t("itemCount", {
                                    count: supplier.itemIds.length,
                                  })}
                                </span>
                                {(supplier.phone ?? supplier.email) && (
                                  <span className="sm:hidden"> · </span>
                                )}
                                {supplier.phone ?? supplier.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p>
                            {supplier.phone ?? (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </p>
                          {supplier.email && (
                            <p className="text-xs text-muted-foreground">
                              {supplier.email}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {t("itemCount", { count: supplier.itemIds.length })}
                        </TableCell>
                        <TableCell className="pr-4 text-muted-foreground">
                          <ChevronRightIcon className="size-4" aria-hidden />
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
