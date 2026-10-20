"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PAGE_SIZES } from "@/lib/list/use-list-params"
import { cn } from "@/lib/utils"

/** Pages voisines de la page en cours montrées de chaque côté ; au-delà, « … ». */
const NEIGHBOURS = 1
const GAP = "gap"

/** Numéros affichés : la première, la dernière, la page en cours et ses voisines (à partir de 0). */
function pageNumbers(page: number, pages: number): (number | typeof GAP)[] {
  const shown = new Set([0, pages - 1])
  for (let offset = -NEIGHBOURS; offset <= NEIGHBOURS; offset++)
    if (page + offset >= 0 && page + offset < pages) shown.add(page + offset)
  const sorted = [...shown].sort((a, b) => a - b)
  return sorted.flatMap((number, index) =>
    index > 0 && number - sorted[index - 1] > 1 ? [GAP, number] : [number]
  )
}

/**
 * Bas de liste : « 51–100 sur 230 », lignes par page, numéros de page. Sur téléphone, « Page 2 sur
 * 5 » et les flèches suffisent.
 */
export function TablePagination({
  page,
  size,
  total,
  onPageChange,
  onSizeChange,
  detached = false,
}: {
  page: number
  size: number
  total: number
  onPageChange: (page: number) => void
  onSizeChange: (size: number) => void
  /** Sous une grille de cartes : une simple ligne, pas le bas d'un tableau. */
  detached?: boolean
}) {
  const t = useTranslations("pagination")
  const pages = Math.max(1, Math.ceil(total / size))
  const from = total === 0 ? 0 : page * size + 1
  const to = Math.min(total, (page + 1) * size)
  const sizeItems = PAGE_SIZES.map((option) => ({
    value: String(option),
    label: String(option),
  }))

  return (
    <div
      className={cn(
        "flex flex-col gap-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
        detached ? "mt-2" : "border-t px-4"
      )}
    >
      <p className="text-muted-foreground" aria-live="polite">
        {t("range", { from, to, total })}
      </p>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="flex items-center gap-2">
          <span className="hidden text-muted-foreground sm:inline">
            {t("perPage")}
          </span>
          <Select
            items={sizeItems}
            value={String(size)}
            onValueChange={(value) => onSizeChange(Number(value))}
          >
            <SelectTrigger size="sm" className="w-20" aria-label={t("perPage")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sizeItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <nav aria-label={t("pages")} className="flex items-center gap-1">
          <span className="mr-2 text-muted-foreground tabular-nums sm:hidden">
            {t("page", { page: page + 1, pages })}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t("previous")}
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeftIcon />
          </Button>
          {pageNumbers(page, pages).map((number, index) =>
            number === GAP ? (
              <span
                key={`${GAP}-${index}`}
                className="hidden w-8 text-center text-muted-foreground sm:inline"
                aria-hidden
              >
                …
              </span>
            ) : (
              <Button
                key={number}
                variant={number === page ? "default" : "ghost"}
                size="icon-sm"
                className="hidden num sm:inline-flex"
                aria-label={t("goTo", { page: number + 1 })}
                aria-current={number === page ? "page" : undefined}
                onClick={() => onPageChange(number)}
              >
                {number + 1}
              </Button>
            )
          )}
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t("next")}
            disabled={page + 1 >= pages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRightIcon />
          </Button>
        </nav>
      </div>
    </div>
  )
}
