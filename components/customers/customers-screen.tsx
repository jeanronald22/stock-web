"use client"

import {
  ChevronRightIcon,
  ContactRoundIcon,
  HardHatIcon,
  SearchIcon,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { EmptyState } from "@/components/catalog/empty-state"
import { FILTER_CONTROL, FilterBar } from "@/components/catalog/filter-bar"
import { StatusFilter } from "@/components/catalog/status-filter"
import { TablePagination } from "@/components/catalog/table-pagination"
import { SearchScene } from "@/components/illustrations/search-scene"
import { StorefrontScene } from "@/components/illustrations/storefront-scene"
import { ItemsTableSkeleton } from "@/components/items/items-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useStockAccess } from "@/components/workspace/stock-access"
import { useCustomersPage } from "@/lib/api/customer-queries"
import { CustomerKind, customerKinds, type Customer } from "@/lib/api/customers"
import { CatalogStatus, StockPermission } from "@/lib/api/stock"
import { useListParams } from "@/lib/list/use-list-params"
import { RecordRoutes } from "@/lib/routes"
import { cn } from "@/lib/utils"

import { ContactsTabs } from "./contacts-tabs"
import { NewCustomerSheet } from "./new-customer-sheet"

const SEARCH_DELAY_MS = 300
const SKELETON_ROWS = 6
/** Valeur « Tous » du filtre de genre : aucun genre ne peut la prendre. */
const ALL_KINDS = "all"

/** Clients et chantiers (D30) : à qui l'on livre, et où. */
export function CustomersScreen() {
  const t = useTranslations("customers")
  const list = useListParams()
  const { text, page, size, status, customerKind } = list.params
  const [typed, setTyped] = useState(text)
  const { setText } = list
  useEffect(() => {
    if (typed.trim() === text) return
    const timer = window.setTimeout(() => setText(typed), SEARCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [typed, text, setText])

  const search = useMemo(
    () => ({ text: text || undefined, status, kind: customerKind }),
    [text, status, customerKind]
  )
  const customers = useCustomersPage(search, page, size)
  const total = customers.data?.total ?? 0
  const archived = status === CatalogStatus.archived
  const empty =
    customers.isSuccess && total === 0 && !text && !archived && !customerKind
  const newButton = useStockAccess().can(StockPermission.recordMovements) && (
    <NewCustomerSheet />
  )
  const kindItems = [
    { value: ALL_KINDS, label: t("allKinds") },
    ...customerKinds.map((kind) => ({
      value: kind,
      label: t(`kinds.${kind}.plural`),
    })),
  ]

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
          illustration={<StorefrontScene />}
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
                  {customers.isFetching ? <Spinner /> : <SearchIcon />}
                </InputGroupAddon>
              </InputGroup>
            }
          >
            <Select
              items={kindItems}
              value={customerKind ?? ALL_KINDS}
              onValueChange={(value) =>
                list.setCustomerKind(
                  customerKinds.find((kind) => kind === value)
                )
              }
            >
              <SelectTrigger
                className={FILTER_CONTROL}
                aria-label={t("kindFilter")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {kindItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <StatusFilter value={status} onChange={list.setStatus} />
          </FilterBar>
          <div className="mt-6 overflow-hidden rounded-2xl border">
            {customers.isPending ? (
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
                    customers.isPlaceholderData && "opacity-60"
                  )}
                >
                  <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">{t("table.name")}</TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t("table.phone")}
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        {t("table.address")}
                      </TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(customers.data?.items ?? []).map((customer) => (
                      <CustomerRow key={customer.id} customer={customer} />
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

/** Icône du genre : un casque pour un chantier, une personne pour un client. */
export function CustomerKindIcon({
  kind,
  className,
}: {
  kind: CustomerKind
  className?: string
}) {
  const Icon = kind === CustomerKind.site ? HardHatIcon : ContactRoundIcon
  return <Icon className={className} aria-hidden />
}

function CustomerRow({ customer }: { customer: Customer }) {
  const t = useTranslations("customers")
  return (
    <TableRow className="relative cursor-pointer">
      <TableCell className="py-3 pl-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CustomerKindIcon kind={customer.kind} className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={RecordRoutes.customer(customer.id)}
                className="truncate font-semibold after:absolute after:inset-0 focus-visible:outline-none"
              >
                {customer.name}
              </Link>
              {customer.status === CatalogStatus.archived && (
                <Badge variant="secondary">{t("restore.badge")}</Badge>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {t(`kinds.${customer.kind}.label`)}
              {/* Petit écran : le téléphone sous le nom, sa colonne étant masquée. */}
              {customer.phone && (
                <span className="md:hidden"> · {customer.phone}</span>
              )}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {customer.phone ?? <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="hidden max-w-64 truncate sm:table-cell">
        {customer.address ?? <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="pr-4 text-muted-foreground">
        <ChevronRightIcon className="size-4" aria-hidden />
      </TableCell>
    </TableRow>
  )
}
