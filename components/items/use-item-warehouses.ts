"use client"

import { useMemo } from "react"

import { useStockAccess } from "@/components/workspace/stock-access"
import {
  StockState,
  type Item,
  type LocationRef,
  type Warehouse,
} from "@/lib/api/stock"
import type { ItemStock, WarehouseStock } from "@/lib/api/vouchers"

/** Un dépôt d'un article : son stock, son seuil et son maximum (D44), et ce que cela veut dire. */
export type WarehouseLine = {
  warehouse: { id: string; name: string }
  stock: WarehouseStock | undefined
  minQuantity: number | null
  maxQuantity: number | null
  /** Emplacement habituel dans ce dépôt (D37). */
  location: LocationRef | null
  state: StockState
}

/** Même règle que l'API (StockState.of) : surveillé seulement avec un seuil ; zéro, c'est la rupture. */
function stateOf(quantity: number, minQuantity: number | null): StockState {
  if (minQuantity === null) return StockState.ok
  if (quantity === 0) return StockState.out
  return quantity <= minQuantity ? StockState.low : StockState.ok
}

/** Du plus grave au moins grave : l'état de l'article est celui de son pire dépôt. */
const SEVERITY: readonly StockState[] = [
  StockState.out,
  StockState.low,
  StockState.ok,
]

/**
 * Les dépôts de la personne où l'article est proposé, et ceux où il reste du stock sans y être
 * proposé ; avec le total et l'état de l'article. Commun à sa fiche, son aperçu et sa fiche PDF.
 */
export function itemWarehouses(
  item: Item,
  warehouses: Warehouse[],
  stock: ItemStock | undefined,
  covers: (warehouseId: string) => boolean
) {
  const entries = stock?.warehouses ?? []
  // Le nom vient du stock (même d'un dépôt archivé), sinon de la liste des dépôts.
  const names = new Map([
    ...warehouses.map((warehouse) => [warehouse.id, warehouse.name] as const),
    ...entries.map(
      (entry) => [entry.warehouse.id, entry.warehouse.name] as const
    ),
  ])
  const ids = new Set([
    ...item.warehouses.map((placement) => placement.warehouseId),
    ...entries.map((entry) => entry.warehouse.id),
  ])
  const lines: WarehouseLine[] = [...ids]
    .filter((id) => names.has(id) && covers(id))
    .map((id) => ({ id, name: names.get(id)! }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((warehouse) => {
      const entry = entries.find(
        (candidate) => candidate.warehouse.id === warehouse.id
      )
      const placement = item.warehouses.find(
        (candidate) => candidate.warehouseId === warehouse.id
      )
      const minQuantity = placement?.minQuantity ?? null
      return {
        warehouse,
        stock: entry,
        minQuantity,
        maxQuantity: placement?.maxQuantity ?? null,
        location: placement?.location ?? null,
        state: stateOf(entry?.quantity ?? 0, minQuantity),
      }
    })
  const total = lines.reduce(
    (sum, line) => sum + (line.stock?.quantity ?? 0),
    0
  )
  const state =
    SEVERITY.find((candidate) =>
      lines.some((line) => line.state === candidate)
    ) ?? StockState.ok
  const alerts = lines.filter((line) => line.state !== StockState.ok).length
  return { lines, total, state, alerts }
}

export function useItemWarehouses(
  item: Item,
  warehouses: Warehouse[],
  stock: ItemStock | undefined
) {
  const { covers } = useStockAccess()
  return useMemo(
    () => itemWarehouses(item, warehouses, stock, covers),
    [item, warehouses, stock, covers]
  )
}
