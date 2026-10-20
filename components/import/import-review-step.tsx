"use client"

import { DownloadIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { useQuantityLabel } from "@/components/items/describe"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CATEGORY_PATH_SEPARATOR } from "@/lib/catalog/category-tree"
import type { PreparedRow } from "@/lib/import/prepare-rows"
import { cn } from "@/lib/utils"

/** Lignes montrées dans l'aperçu et dans la liste à corriger ; le reste est compté. */
const PREVIEW_ROWS = 20
const PROBLEM_ROWS = 50

/** Couleur d'un chiffre du bilan : ce qui part, ce qui reste à corriger. */
const StatTone = { good: "good", bad: "bad", neutral: "neutral" } as const
type StatTone = (typeof StatTone)[keyof typeof StatTone]

/**
 * Ce qui va partir, avant d'envoyer quoi que ce soit : les lignes prêtes, celles à corriger (et
 * pourquoi), les catégories à créer, le stock de départ ; puis un aperçu des premières lignes.
 */
export function ImportReviewStep({
  ready,
  blocked,
  newCategories,
  openingWarehouse,
  onDownloadBlocked,
}: {
  ready: PreparedRow[]
  blocked: PreparedRow[]
  newCategories: number
  /** Nom du dépôt du stock de départ ; null sans stock de départ. */
  openingWarehouse: string | null
  onDownloadBlocked: () => void
}) {
  const t = useTranslations("import.review")
  const tUnits = useTranslations("units")
  const quantityLabel = useQuantityLabel()
  const withStock = ready.filter((row) => row.opening).length

  return (
    <div className="space-y-8">
      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat
          label={t("stats.ready")}
          value={ready.length}
          tone={StatTone.good}
        />
        <Stat
          label={t("stats.blocked")}
          value={blocked.length}
          tone={blocked.length > 0 ? StatTone.bad : StatTone.neutral}
        />
        <Stat label={t("stats.categories")} value={newCategories} />
      </dl>
      {openingWarehouse && withStock > 0 && (
        <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
          {t("opening", { count: withStock, warehouse: openingWarehouse })}
        </p>
      )}

      {blocked.length > 0 && (
        <section aria-labelledby="import-blocked" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="import-blocked" className="font-semibold">
                {t("blocked.title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("blocked.description")}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={onDownloadBlocked}>
              <DownloadIcon />
              {t("blocked.download")}
            </Button>
          </div>
          <ul className="divide-y rounded-2xl border text-sm">
            {blocked.slice(0, PROBLEM_ROWS).map((row) => (
              <li key={row.line} className="flex gap-3 px-4 py-2.5">
                <span className="w-16 shrink-0 num text-muted-foreground">
                  {t("line", { line: row.line })}
                </span>
                <span className="min-w-0">
                  <span className="font-medium">
                    {row.item.name || t("unnamed")}
                  </span>
                  <span className="text-destructive">
                    {" · "}
                    {row.problems
                      .map((problem) => t(`problems.${problem}`))
                      .join(" ; ")}
                  </span>
                </span>
              </li>
            ))}
            {blocked.length > PROBLEM_ROWS && (
              <li className="px-4 py-2.5 text-muted-foreground">
                {t("more", { count: blocked.length - PROBLEM_ROWS })}
              </li>
            )}
          </ul>
        </section>
      )}

      {ready.length > 0 && (
        <section aria-labelledby="import-preview" className="space-y-3">
          <h2 id="import-preview" className="font-semibold">
            {t("preview.title", {
              shown: Math.min(PREVIEW_ROWS, ready.length),
              total: ready.length,
            })}
          </h2>
          <div className="overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">{t("preview.item")}</TableHead>
                  <TableHead>{t("preview.unit")}</TableHead>
                  <TableHead>{t("preview.category")}</TableHead>
                  <TableHead>{t("preview.packaging")}</TableHead>
                  <TableHead className="pr-4 text-right">
                    {t("preview.stock")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ready.slice(0, PREVIEW_ROWS).map((row) => {
                  const packaging = row.item.packagings[0]
                  return (
                    <TableRow key={row.line}>
                      <TableCell className="pl-4">
                        <p className="font-medium">{row.item.name}</p>
                      </TableCell>
                      <TableCell>
                        {tUnits(`${row.item.baseUnit}.label`)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.categoryPath.join(CATEGORY_PATH_SEPARATOR)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {packaging &&
                          `${packaging.name} = ${quantityLabel(row.item.baseUnit, packaging.quantity)}`}
                      </TableCell>
                      <TableCell className="pr-4 text-right num">
                        {row.opening &&
                          quantityLabel(
                            row.item.baseUnit,
                            row.opening.quantity
                          )}
                        {row.opening?.batch && (
                          <p className="text-xs text-muted-foreground">
                            {t("preview.batch", { batch: row.opening.batch })}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  tone = StatTone.neutral,
}: {
  label: string
  value: number
  tone?: StatTone
}) {
  return (
    <div className="rounded-2xl border p-3 sm:p-4">
      <dt className="label-caps">{label}</dt>
      <dd
        className={cn(
          "mt-1 num text-2xl font-semibold sm:text-3xl",
          tone === StatTone.good && "text-primary",
          tone === StatTone.bad && "text-destructive"
        )}
      >
        {value}
      </dd>
    </div>
  )
}
