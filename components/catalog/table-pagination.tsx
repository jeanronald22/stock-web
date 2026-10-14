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

/** Bas de tableau : « 51–100 sur 230 », lignes par page, page précédente et suivante. */
export function TablePagination({
  page,
  size,
  total,
  onPageChange,
  onSizeChange,
}: {
  page: number
  size: number
  total: number
  onPageChange: (page: number) => void
  onSizeChange: (size: number) => void
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
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
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
        <div className="flex items-center gap-1">
          <span className="mr-2 text-muted-foreground tabular-nums">
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
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t("next")}
            disabled={page + 1 >= pages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
