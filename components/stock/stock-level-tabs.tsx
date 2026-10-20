"use client"

import { useTranslations } from "next-intl"

import {
  StatusTabs,
  StatusTone,
  type StatusTab,
} from "@/components/catalog/status-tabs"
import { useStockPage } from "@/lib/api/voucher-queries"
import type { StockSearch } from "@/lib/api/vouchers"
import { STOCK_ALERT_STATES } from "@/lib/list/use-list-params"
import { StockAlertParam } from "@/lib/routes"

/** Valeur de l'onglet « Tous » : distincte de toute valeur d'alerte. */
const ALL_LEVELS = "all"
type LevelTab = StockAlertParam | typeof ALL_LEVELS

/** Seul le total compte : une ligne suffit. */
const COUNT_PAGE_SIZE = 1

function useLevelCount(search: StockSearch, level: LevelTab) {
  return useStockPage(
    {
      ...search,
      stockStates: level === ALL_LEVELS ? undefined : STOCK_ALERT_STATES[level],
    },
    0,
    COUNT_PAGE_SIZE
  ).data?.total
}

/**
 * Niveaux de stock en onglets, chacun avec son nombre d'articles (dans les dépôts, la catégorie et
 * la recherche choisis) : ce qu'il faut commander se voit avant d'ouvrir la liste.
 */
export function StockLevelTabs({
  search,
  value,
  onChange,
}: {
  /** Filtres posés, hors niveau. */
  search: StockSearch
  value: StockAlertParam | undefined
  onChange: (level: StockAlertParam | undefined) => void
}) {
  const t = useTranslations("catalog.stockAlert")
  const counts: Record<LevelTab, number | undefined> = {
    [ALL_LEVELS]: useLevelCount(search, ALL_LEVELS),
    [StockAlertParam.any]: useLevelCount(search, StockAlertParam.any),
    [StockAlertParam.low]: useLevelCount(search, StockAlertParam.low),
    [StockAlertParam.out]: useLevelCount(search, StockAlertParam.out),
  }
  const tabs: StatusTab<LevelTab>[] = [
    { value: ALL_LEVELS, label: t("tab"), count: counts[ALL_LEVELS] },
    ...Object.entries(StockAlertParam).map(([key, level]) => ({
      value: level,
      label: t(key as keyof typeof StockAlertParam),
      count: counts[level],
      tone:
        level === StockAlertParam.out ? StatusTone.danger : StatusTone.warning,
    })),
  ]
  return (
    <StatusTabs
      label={t("label")}
      tabs={tabs}
      value={value ?? ALL_LEVELS}
      onChange={(next) =>
        onChange(Object.values(StockAlertParam).find((level) => level === next))
      }
    />
  )
}
