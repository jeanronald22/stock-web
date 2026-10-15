"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useRef, useState } from "react"

import { useApi } from "@/lib/api/api-provider"
import { stockKeys } from "@/lib/api/stock-queries"
import {
  ImportOutcome,
  StockLimits,
  type Category,
  type ImportBatch,
} from "@/lib/api/stock"
import {
  planCategories,
  type PlannedCategory,
} from "@/lib/import/category-plan"
import type { PreparedRow } from "@/lib/import/prepare-rows"
import { useActiveOrganization } from "@/lib/organization/active-organization"

/** Où en est l'import : en cours, interrompu (réseau), terminé. */
export const ImportPhase = {
  idle: "idle",
  running: "running",
  interrupted: "interrupted",
  done: "done",
} as const
export type ImportPhase = (typeof ImportPhase)[keyof typeof ImportPhase]

export type ImportReport = {
  imported: number
  /** Lignes refusées par l'API, avec son code (référence déjà prise…). */
  rejected: { row: PreparedRow; code: string }[]
  /** Ajustements du stock de départ, un par paquet. */
  openings: { id: string; number: string }[]
  /** Pourquoi un stock de départ n'a pas été posé (codes distincts). */
  openingCodes: string[]
}

/** Tout ce qui part, avec ses identifiants : une reprise renvoie exactement la même chose. */
type ImportPlan = {
  categories: PlannedCategory[]
  batches: { rows: PreparedRow[]; payload: ImportBatch }[]
}

const EMPTY_REPORT: ImportReport = {
  imported: 0,
  rejected: [],
  openings: [],
  openingCodes: [],
}

/**
 * Import du catalogue (D36) : catégories manquantes, puis articles par paquets avec leur stock de
 * départ. Une coupure interrompt l'import ; « reprendre » renvoie le paquet en cours, sans doublon.
 */
export function useItemImport() {
  const { stock } = useApi()
  const queryClient = useQueryClient()
  const organizationId = useActiveOrganization().activeOrganizationId
  const [phase, setPhase] = useState<ImportPhase>(ImportPhase.idle)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [report, setReport] = useState<ImportReport>(EMPTY_REPORT)
  const [error, setError] = useState<unknown>(null)
  const plan = useRef<ImportPlan | null>(null)
  // Étapes déjà faites : la reprise repart de la première qui ne l'est pas.
  const createdCategories = useRef(0)
  const sentBatches = useRef(0)

  const run = useCallback(async () => {
    const current = plan.current
    if (!current) return
    setPhase(ImportPhase.running)
    setError(null)
    try {
      while (createdCategories.current < current.categories.length) {
        const { id, name, parentId } =
          current.categories[createdCategories.current]
        await stock.createCategory(id, { name, parentId })
        createdCategories.current += 1
      }
      while (sentBatches.current < current.batches.length) {
        const batch = current.batches[sentBatches.current]
        const result = await stock.importItems(batch.payload)
        const rejected = result.items.flatMap((outcome, index) =>
          outcome.outcome === ImportOutcome.rejected
            ? [{ row: batch.rows[index], code: outcome.code ?? "" }]
            : []
        )
        setReport((previous) => ({
          imported: previous.imported + result.items.length - rejected.length,
          rejected: [...previous.rejected, ...rejected],
          openings: result.opening
            ? [...previous.openings, result.opening]
            : previous.openings,
          openingCodes:
            result.openingCode &&
            !previous.openingCodes.includes(result.openingCode)
              ? [...previous.openingCodes, result.openingCode]
              : previous.openingCodes,
        }))
        sentBatches.current += 1
        setProgress((previous) => ({
          ...previous,
          done: previous.done + batch.rows.length,
        }))
      }
      setPhase(ImportPhase.done)
    } catch (failure) {
      setError(failure)
      setPhase(ImportPhase.interrupted)
    } finally {
      await queryClient.invalidateQueries({
        queryKey: stockKeys.all(organizationId),
      })
    }
  }, [stock, queryClient, organizationId])

  /** [openingWarehouseId] : dépôt du stock de départ ; null sans stock de départ. */
  const start = useCallback(
    async (rows: PreparedRow[], openingWarehouseId: string | null) => {
      setPhase(ImportPhase.running)
      setProgress({ done: 0, total: rows.length })
      setReport(EMPTY_REPORT)
      createdCategories.current = 0
      sentBatches.current = 0
      let existing: Category[]
      try {
        existing = await stock.categories()
      } catch (failure) {
        setError(failure)
        setPhase(ImportPhase.interrupted)
        return
      }
      const categories = planCategories(rows, existing)
      const batches = Array.from(
        { length: Math.ceil(rows.length / StockLimits.itemsPerBatch) },
        (_, index) => {
          const slice = rows.slice(
            index * StockLimits.itemsPerBatch,
            (index + 1) * StockLimits.itemsPerBatch
          )
          const lines = slice.flatMap((row) =>
            row.opening ? [{ itemId: row.item.id, ...row.opening }] : []
          )
          const payload: ImportBatch = {
            items: slice.map((row) => ({
              ...row.item,
              categoryId: categories.byRow.get(row) ?? null,
            })),
            opening:
              openingWarehouseId && lines.length > 0
                ? {
                    voucherId: crypto.randomUUID(),
                    warehouseId: openingWarehouseId,
                    lines,
                  }
                : undefined,
          }
          return { rows: slice, payload }
        }
      )
      plan.current = { categories: categories.created, batches }
      await run()
    },
    [stock, run]
  )

  return { phase, progress, report, error, start, resume: run }
}
