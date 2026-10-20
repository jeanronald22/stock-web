"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

import { CustomerKind } from "@/lib/api/customers"
import { CatalogStatus, StockState } from "@/lib/api/stock"
import { VoucherOrder } from "@/lib/api/vouchers"
import {
  ARCHIVED_STATUS_PARAM,
  CustomerKindParam,
  LIST_VIEW_PARAM,
  ListQueryParams,
  OLDEST_FIRST_PARAM,
  StockAlertParam,
} from "@/lib/routes"
import { VoucherKind } from "@/lib/vouchers/voucher-kinds"

/** Affichage d'une liste : grille de cartes avec les photos (par défaut), ou tableau dense. */
export const ListView = { list: "list", grid: "grid" } as const
export type ListView = (typeof ListView)[keyof typeof ListView]

/** Nombres de lignes proposés ; le premier de la liste n'est pas le défaut (voir DEFAULT_PAGE_SIZE). */
export const PAGE_SIZES = [25, 50, 100] as const
export const DEFAULT_PAGE_SIZE = 50

/** États du stock demandés à l'API pour chaque valeur du filtre « alerte ». */
export const STOCK_ALERT_STATES: Record<StockAlertParam, StockState[]> = {
  [StockAlertParam.any]: [StockState.low, StockState.out],
  [StockAlertParam.low]: [StockState.low],
  [StockAlertParam.out]: [StockState.out],
}

const CUSTOMER_KINDS: Record<CustomerKindParam, CustomerKind> = {
  [CustomerKindParam.customers]: CustomerKind.customer,
  [CustomerKindParam.sites]: CustomerKind.site,
}

const DAY = /^\d{4}-\d{2}-\d{2}$/

export type ListParams = {
  text: string
  /** Vide : tous les dépôts. */
  warehouseIds: string[]
  categoryId: string | undefined
  supplierId: string | undefined
  customerId: string | undefined
  itemId: string | undefined
  customerKind: CustomerKind | undefined
  stockAlert: StockAlertParam | undefined
  /** Page affichée, à partir de 0 (l'adresse montre « page=1 » pour la première). */
  page: number
  size: number
  status: CatalogStatus
  voucherKind: VoucherKind | undefined
  /** Jours inclus, AAAA-MM-JJ. */
  from: string | undefined
  to: string | undefined
  order: VoucherOrder
  view: ListView
}

/** Filtres que « Effacer les filtres » remet à zéro (pas la page, les lignes ni le statut). */
const FILTER_KEYS = [
  "search",
  "warehouse",
  "category",
  "supplier",
  "customer",
  "item",
  "customerKind",
  "stockAlert",
  "voucherType",
  "from",
  "to",
  "order",
] as const satisfies readonly (keyof typeof ListQueryParams)[]

export type ListParamKey = keyof typeof ListQueryParams

/**
 * Filtres comptés sur le bouton « Filtres » : la période (du, au) en vaut un seul ; le statut
 * (archivés) en est un, même s'il ne compte pas pour dire la liste filtrée.
 */
const COUNTED_FILTERS: readonly (readonly ListParamKey[])[] = [
  ...FILTER_KEYS.filter((key) => key !== "search" && key !== "to").map(
    (key): ListParamKey[] => (key === "from" ? ["from", "to"] : [key])
  ),
  ["status"],
]

/** « Effacer les filtres » remet aussi la liste sur les fiches actives. */
const RESET_KEYS: readonly ListParamKey[] = [...FILTER_KEYS, "status"]

type Change = string | number | readonly string[] | undefined

function positiveInteger(value: string | null): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function day(value: string | null): string | undefined {
  return value && DAY.test(value) ? value : undefined
}

/**
 * État d'une liste dans l'adresse (recherche, filtres, page, lignes) : un lien partagé ou un retour
 * arrière rouvre exactement la même vue. Changer un filtre ramène à la première page.
 */
export function useListParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Même liste tant que l'adresse ne change pas : les écrans peuvent la mettre en dépendance.
  const warehouseKey = searchParams.getAll(ListQueryParams.warehouse).join(",")
  const warehouseIds = useMemo(
    () => [...new Set(warehouseKey ? warehouseKey.split(",") : [])],
    [warehouseKey]
  )
  const size = positiveInteger(searchParams.get(ListQueryParams.size))
  const stockAlert = searchParams.get(ListQueryParams.stockAlert)
  const params: ListParams = {
    text: searchParams.get(ListQueryParams.search) ?? "",
    warehouseIds,
    categoryId: searchParams.get(ListQueryParams.category) ?? undefined,
    supplierId: searchParams.get(ListQueryParams.supplier) ?? undefined,
    customerId: searchParams.get(ListQueryParams.customer) ?? undefined,
    itemId: searchParams.get(ListQueryParams.item) ?? undefined,
    customerKind:
      CUSTOMER_KINDS[
        searchParams.get(ListQueryParams.customerKind) as CustomerKindParam
      ],
    stockAlert: Object.values(StockAlertParam).find(
      (value) => value === stockAlert
    ),
    page: (positiveInteger(searchParams.get(ListQueryParams.page)) ?? 1) - 1,
    size:
      PAGE_SIZES.find((candidate) => candidate === size) ?? DEFAULT_PAGE_SIZE,
    status:
      searchParams.get(ListQueryParams.status) === ARCHIVED_STATUS_PARAM
        ? CatalogStatus.archived
        : CatalogStatus.active,
    voucherKind: Object.values(VoucherKind).find(
      (kind) => kind === searchParams.get(ListQueryParams.voucherType)
    ),
    from: day(searchParams.get(ListQueryParams.from)),
    to: day(searchParams.get(ListQueryParams.to)),
    order:
      searchParams.get(ListQueryParams.order) === OLDEST_FIRST_PARAM
        ? VoucherOrder.oldestFirst
        : VoucherOrder.newestFirst,
    view:
      searchParams.get(ListQueryParams.view) === LIST_VIEW_PARAM
        ? ListView.list
        : ListView.grid,
  }

  const update = useCallback(
    (changes: Partial<Record<keyof typeof ListQueryParams, Change>>) => {
      const next = new URLSearchParams(searchParams)
      Object.entries(changes).forEach(([key, value]) => {
        const name = ListQueryParams[key as keyof typeof ListQueryParams]
        next.delete(name)
        if (Array.isArray(value))
          value.forEach((each) => next.append(name, each))
        else if (value !== undefined && value !== "")
          next.set(name, String(value))
      })
      if (!("page" in changes)) next.delete(ListQueryParams.page)
      const query = next.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    },
    [router, pathname, searchParams]
  )

  const filtered = FILTER_KEYS.some(
    (key) => searchParams.get(ListQueryParams[key]) !== null
  )
  const countFilters = (shownElsewhere: readonly ListParamKey[] = []) =>
    COUNTED_FILTERS.filter(
      (keys) =>
        !keys.some((key) => shownElsewhere.includes(key)) &&
        keys.some((key) => searchParams.get(ListQueryParams[key]) !== null)
    ).length

  return {
    params,
    /** Au moins un filtre posé : la liste n'est pas la vue complète. */
    filtered,
    /**
     * Filtres posés hors recherche, pour le bouton « Filtres ». [shownElsewhere] : ceux que l'écran
     * montre ailleurs (en onglets), qui ne se comptent pas dans le menu.
     */
    countFilters,
    setText: (text: string) => update({ search: text.trim() || undefined }),
    setWarehouses: (warehouseIds: string[]) =>
      update({ warehouse: warehouseIds }),
    setCategory: (categoryId: string | undefined) =>
      update({ category: categoryId }),
    setSupplier: (supplierId: string | undefined) =>
      update({ supplier: supplierId }),
    setCustomerKind: (kind: CustomerKind | undefined) =>
      update({
        customerKind: (Object.keys(CUSTOMER_KINDS) as CustomerKindParam[]).find(
          (param) => CUSTOMER_KINDS[param] === kind
        ),
      }),
    setStockAlert: (alert: StockAlertParam | undefined) =>
      update({ stockAlert: alert }),
    setPage: (page: number) =>
      update({ page: page > 0 ? page + 1 : undefined }),
    setSize: (pageSize: number) =>
      update({ size: pageSize === DEFAULT_PAGE_SIZE ? undefined : pageSize }),
    setStatus: (status: CatalogStatus) =>
      update({
        status:
          status === CatalogStatus.archived ? ARCHIVED_STATUS_PARAM : undefined,
      }),
    setVoucherKind: (kind: VoucherKind | undefined) =>
      update({ voucherType: kind }),
    // L'affichage n'est pas un filtre : il garde la page en cours.
    setView: (view: ListView) =>
      update({
        view: view === ListView.list ? LIST_VIEW_PARAM : undefined,
        page: searchParams.get(ListQueryParams.page) ?? undefined,
      }),
    setPeriod: (from: string | undefined, to: string | undefined) =>
      update({ from, to }),
    setOrder: (order: VoucherOrder) =>
      update({
        order:
          order === VoucherOrder.oldestFirst ? OLDEST_FIRST_PARAM : undefined,
      }),
    reset: () =>
      update(Object.fromEntries(RESET_KEYS.map((key) => [key, undefined]))),
  }
}
