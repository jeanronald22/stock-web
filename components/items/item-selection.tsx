"use client"

import { FileDownIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useCallback, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { Item } from "@/lib/api/stock"

import { MAX_ITEM_SHEETS, useItemSheetPdf } from "./use-item-sheet-pdf"

/** Choix d'articles dans le catalogue ; null hors du mode sélection. */
export type ItemSelection = {
  isSelected: (id: string) => boolean
  toggle: (item: Item) => void
}

/**
 * Articles choisis pour en exporter les fiches. Le choix survit au changement de page et de
 * filtres : on compose sa liste en parcourant le catalogue. Cinquante au plus.
 */
export function useItemSelection() {
  const [active, setActive] = useState(false)
  const [chosen, setChosen] = useState<ReadonlyMap<string, Item>>(new Map())

  const toggle = useCallback((item: Item) => {
    setChosen((current) => {
      const next = new Map(current)
      if (next.has(item.id)) next.delete(item.id)
      else if (next.size < MAX_ITEM_SHEETS) next.set(item.id, item)
      return next
    })
  }, [])
  const addAll = useCallback((items: Item[]) => {
    setChosen((current) => {
      const next = new Map(current)
      for (const item of items) {
        if (next.size >= MAX_ITEM_SHEETS) break
        next.set(item.id, item)
      }
      return next
    })
  }, [])
  const stop = useCallback(() => {
    setActive(false)
    setChosen(new Map())
  }, [])

  const selection = useMemo<ItemSelection | null>(
    () => (active ? { isSelected: (id) => chosen.has(id), toggle } : null),
    [active, chosen, toggle]
  )
  return {
    selection,
    items: [...chosen.values()],
    start: () => setActive(true),
    stop,
    addAll,
  }
}

/**
 * Barre du mode sélection, posée en bas de l'écran : combien d'articles, toute la page d'un geste,
 * puis l'export de leurs fiches en un seul PDF.
 */
export function ItemSelectionBar({
  items,
  page,
  onAddPage,
  onClose,
}: {
  items: Item[]
  /** Les articles affichés : « Toute la page » les ajoute. */
  page: Item[]
  onAddPage: () => void
  onClose: () => void
}) {
  const t = useTranslations("items.selection")
  const sheet = useItemSheetPdf()
  const full = items.length >= MAX_ITEM_SHEETS
  const pageChosen = page.every((item) =>
    items.some((chosen) => chosen.id === item.id)
  )
  return (
    <div
      role="region"
      aria-label={t("label")}
      className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-2xl flex-wrap items-center gap-2 rounded-2xl border bg-background p-3 shadow-lg sm:flex-nowrap"
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("close")}
        onClick={onClose}
      >
        <XIcon />
      </Button>
      <p className="mr-auto text-sm" aria-live="polite">
        <span className="font-semibold">
          {t("count", { count: items.length })}
        </span>
        {full && (
          <span className="block text-xs text-muted-foreground">
            {t("max", { max: MAX_ITEM_SHEETS })}
          </span>
        )}
      </p>
      <div className="flex w-full gap-2 sm:w-auto">
        <Button
          variant="outline"
          className="flex-1 sm:flex-none"
          disabled={pageChosen || full}
          onClick={onAddPage}
        >
          {t("page")}
        </Button>
        <Button
          className="flex-1 sm:flex-none"
          disabled={items.length === 0 || sheet.busy}
          onClick={() =>
            void sheet.download(items).then((done) => done && onClose())
          }
        >
          {sheet.busy ? <Spinner /> : <FileDownIcon />}
          {sheet.busy ? t("exporting") : t("export")}
        </Button>
      </div>
    </div>
  )
}
