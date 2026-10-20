"use client"

import { useTranslations } from "next-intl"
import { useMemo } from "react"

import { DateRangePicker } from "@/components/catalog/date-range-picker"
import { EmptyState } from "@/components/catalog/empty-state"
import { FILTER_CONTROL, FilterBar } from "@/components/catalog/filter-bar"
import { SupplierFilter } from "@/components/catalog/supplier-filter"
import { TablePagination } from "@/components/catalog/table-pagination"
import { WarehouseFilter } from "@/components/catalog/warehouse-filter"
import { DocumentScene } from "@/components/illustrations/document-scene"
import { ItemsTableSkeleton } from "@/components/items/items-table"
import { OutboxPanel } from "@/components/offline/outbox-panel"
import { VouchersTabs } from "@/components/requests/vouchers-tabs"
import { usePageTour } from "@/components/tour/tour-provider"
import { Button } from "@/components/ui/button"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useVouchersPage } from "@/lib/api/voucher-queries"
import { useListParams, type ListParamKey } from "@/lib/list/use-list-params"
import { cn } from "@/lib/utils"
import { VOUCHER_KIND_SEARCH } from "@/lib/vouchers/voucher-kinds"

import { NewVoucherButtons } from "./new-voucher-buttons"
import { VoucherKindTabs } from "./voucher-kind-tabs"
import { VoucherOrderToggle } from "./voucher-order-toggle"
import { VouchersTable } from "./vouchers-table"

const SKELETON_ROWS = 8
/** La sorte de bon est en onglets ; la période, toujours visible : ni l'une ni l'autre dans « Filtres ». */
const OUTSIDE_MENU: readonly ListParamKey[] = ["voucherType", "from", "to"]

/**
 * Registre des bons : la sorte en onglets, la période toujours visible, puis dépôts et fournisseur.
 * Les onglets comptent dans les mêmes dépôts et la même période que la liste.
 */
export function VouchersScreen() {
  const t = useTranslations("vouchers")
  const list = useListParams()
  const {
    warehouseIds,
    voucherKind,
    supplierId,
    customerId,
    itemId,
    from,
    to,
    order,
    page,
    size,
  } = list.params
  const scope = useMemo(
    () => ({ warehouseIds, supplierId, customerId, itemId, from, to, order }),
    [warehouseIds, supplierId, customerId, itemId, from, to, order]
  )
  const search = useMemo(
    () => ({ ...scope, ...(voucherKind && VOUCHER_KIND_SEARCH[voucherKind]) }),
    [scope, voucherKind]
  )
  const vouchers = useVouchersPage(search, page, size)
  const total = vouchers.data?.total ?? 0
  const empty = vouchers.isSuccess && total === 0 && !list.filtered
  usePageTour("vouchers", { ready: vouchers.isSuccess })

  return (
    <PageBody>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={empty ? undefined : <NewVoucherButtons />}
      />
      <VouchersTabs />
      <OutboxPanel />
      {empty ? (
        <EmptyState
          illustration={<DocumentScene />}
          title={t("empty.title")}
          description={t("empty.description")}
          action={<NewVoucherButtons className="justify-center" />}
        />
      ) : (
        <>
          <VoucherKindTabs
            search={scope}
            value={voucherKind}
            onChange={list.setVoucherKind}
          />
          <FilterBar
            className="mt-3"
            activeCount={list.countFilters(OUTSIDE_MENU)}
            onClear={list.reset}
            lead={
              <DateRangePicker
                from={from}
                to={to}
                onChange={list.setPeriod}
                label={t("period.label")}
                clearable
                className={cn(FILTER_CONTROL, "h-11")}
              />
            }
            trailing={
              <VoucherOrderToggle order={order} onChange={list.setOrder} />
            }
          >
            <WarehouseFilter
              value={warehouseIds}
              onChange={list.setWarehouses}
            />
            <SupplierFilter value={supplierId} onChange={list.setSupplier} />
          </FilterBar>
          <div className="mt-4 overflow-hidden rounded-xl border">
            {vouchers.isPending ? (
              <ItemsTableSkeleton rows={SKELETON_ROWS} />
            ) : total === 0 ? (
              <div className="p-10 text-center">
                <p className="text-muted-foreground">{t("noResult")}</p>
                <Button variant="outline" className="mt-4" onClick={list.reset}>
                  {t("clearFilters")}
                </Button>
              </div>
            ) : (
              <>
                <VouchersTable
                  vouchers={vouchers.data?.items ?? []}
                  stale={vouchers.isPlaceholderData}
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
