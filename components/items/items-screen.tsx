"use client"

import {
  BoxIcon,
  ChevronRightIcon,
  PlusIcon,
  SearchIcon,
  WarehouseIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useDeferredValue, useState } from "react"

import { EmptyState } from "@/components/catalog/empty-state"
import { CatalogScene } from "@/components/illustrations/catalog-scene"
import { SearchScene } from "@/components/illustrations/search-scene"
import { usePageTour } from "@/components/tour/tour-provider"
import { Badge } from "@/components/ui/badge"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { CatalogStatus, type Item } from "@/lib/api/stock"
import { useItems, useWarehouses } from "@/lib/api/stock-queries"
import { ListQueryParams, RecordRoutes, Routes } from "@/lib/routes"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"

import { usePackagingSummary } from "./describe"

/** Valeur du filtre « Tous les dépôts » (aucun identifiant de dépôt ne peut la prendre). */
const ALL_WAREHOUSES = "all"
const SKELETON_ROWS = 5

export function ItemsScreen() {
  const t = useTranslations("items")
  const router = useRouter()
  const searchParams = useSearchParams()
  const warehouseId = searchParams.get(ListQueryParams.warehouse) ?? undefined
  const [text, setText] = useState("")
  const [status, setStatus] = useState<CatalogStatus>(CatalogStatus.active)
  // La liste suit la saisie sans bloquer le clavier : la recherche part sur la valeur différée.
  const deferredText = useDeferredValue(text.trim())
  const archived = status === CatalogStatus.archived

  const warehouses = useWarehouses()
  const items = useItems({
    text: deferredText || undefined,
    warehouseId,
    status,
  })
  const rows = items.data?.pages.flatMap((page) => page.items) ?? []
  const total = items.data?.pages[0]?.total ?? 0
  const filtered = !!deferredText || !!warehouseId
  usePageTour("items", { ready: items.isSuccess && warehouses.isSuccess })

  const setWarehouse = (value: string | null) => {
    const params = new URLSearchParams(searchParams)
    if (!value || value === ALL_WAREHOUSES)
      params.delete(ListQueryParams.warehouse)
    else params.set(ListQueryParams.warehouse, value)
    const query = params.toString()
    router.replace(query ? `${Routes.items}?${query}` : Routes.items, {
      scroll: false,
    })
  }

  const warehouseOptions = [
    { value: ALL_WAREHOUSES, label: t("allWarehouses") },
    ...(warehouses.data ?? []).map((warehouse) => ({
      value: warehouse.id,
      label: warehouse.name,
    })),
  ]
  const newButton = (
    <Link
      href={Routes.newItem}
      className={buttonVariants({ size: "lg" })}
      {...tourAnchor(TourAnchors.newItem)}
    >
      <PlusIcon />
      {t("new")}
    </Link>
  )
  const catalogEmpty = items.isSuccess && total === 0 && !filtered && !archived

  return (
    <PageBody>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={newButton}
      />

      {!catalogEmpty && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <InputGroup
            className="sm:flex-1"
            {...tourAnchor(TourAnchors.itemSearch)}
          >
            <InputGroupInput
              type="search"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
            />
            <InputGroupAddon>
              {items.isFetching && !items.isFetchingNextPage ? (
                <Spinner />
              ) : (
                <SearchIcon />
              )}
            </InputGroupAddon>
          </InputGroup>
          <Select
            items={warehouseOptions}
            value={warehouseId ?? ALL_WAREHOUSES}
            onValueChange={setWarehouse}
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
      )}

      <div className="mt-6">
        {items.isPending ? (
          <div className="divide-y rounded-2xl border">
            {Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <div key={index} className="flex items-center gap-4 p-4">
                <Skeleton className="size-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : catalogEmpty ? (
          <EmptyState
            illustration={<CatalogScene />}
            title={t("empty.title")}
            description={t("empty.description")}
            action={newButton}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            illustration={<SearchScene />}
            title={t("noResult.title")}
            description={t("noResult.description")}
            action={
              filtered && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setText("")
                    setWarehouse(null)
                  }}
                >
                  {t("noResult.reset")}
                </Button>
              )
            }
          />
        ) : (
          <>
            <p
              className="mb-3 text-sm text-muted-foreground"
              aria-live="polite"
            >
              {t("total", { count: total })}
            </p>
            <ul className="divide-y overflow-hidden rounded-2xl border">
              {rows.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </ul>
            {items.hasNextPage && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => void items.fetchNextPage()}
                  disabled={items.isFetchingNextPage}
                >
                  {items.isFetchingNextPage && <Spinner />}
                  {t("loadMore")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

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

function ItemRow({ item }: { item: Item }) {
  const t = useTranslations()
  const packagingSummary = usePackagingSummary()
  const summary = packagingSummary(item.baseUnit, item.packagings)

  return (
    <li>
      <Link
        href={RecordRoutes.item(item.id)}
        className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
      >
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
          aria-hidden
        >
          <BoxIcon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-semibold">{item.name}</span>
            {item.reference && (
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {item.reference}
              </span>
            )}
            {item.status === CatalogStatus.archived && (
              <Badge variant="secondary">{t("items.restore.badge")}</Badge>
            )}
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted-foreground">
            {t(`units.${item.baseUnit}.label`)}
            {summary && ` · ${summary}`}
          </span>
        </span>
        <span className="hidden shrink-0 text-sm text-muted-foreground sm:block">
          {t("items.warehouseCount", { count: item.warehouseIds.length })}
        </span>
        <ChevronRightIcon
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </Link>
    </li>
  )
}
