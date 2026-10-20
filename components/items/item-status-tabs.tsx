"use client"

import { useTranslations } from "next-intl"

import { StatusTabs, type StatusTab } from "@/components/catalog/status-tabs"
import { CatalogStatus, type ItemSearch } from "@/lib/api/stock"
import { useItemsPage } from "@/lib/api/stock-queries"

/** Seul le total compte : une ligne suffit. */
const COUNT_PAGE_SIZE = 1

function useStatusCount(search: ItemSearch, status: CatalogStatus) {
  return useItemsPage({ ...search, status }, 0, COUNT_PAGE_SIZE).data?.total
}

/** Articles actifs ou archivés, chacun avec son nombre dans les filtres choisis. */
export function ItemStatusTabs({
  search,
  value,
  onChange,
}: {
  /** Filtres posés, hors statut. */
  search: ItemSearch
  value: CatalogStatus
  onChange: (status: CatalogStatus) => void
}) {
  const t = useTranslations("catalog.status")
  const counts: Record<CatalogStatus, number | undefined> = {
    [CatalogStatus.active]: useStatusCount(search, CatalogStatus.active),
    [CatalogStatus.archived]: useStatusCount(search, CatalogStatus.archived),
  }
  const tabs: StatusTab<CatalogStatus>[] = Object.values(CatalogStatus).map(
    (status) => ({ value: status, label: t(status), count: counts[status] })
  )
  return (
    <StatusTabs
      label={t("label")}
      tabs={tabs}
      value={value}
      onChange={onChange}
    />
  )
}
