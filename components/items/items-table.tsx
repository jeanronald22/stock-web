"use client"

import { ChevronRightIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CatalogStatus, type Item } from "@/lib/api/stock"
import { cn } from "@/lib/utils"

import { useQuantityLabel } from "./describe"
import { ItemLink } from "./item-link"
import { ItemThumb } from "./item-thumb"

/** Noms de dépôts montrés dans une ligne ; au-delà, « +2 ». */
const VISIBLE_WAREHOUSES = 2

/**
 * Tableau des articles : nom et catégorie, référence, unité, conditionnements, dépôts. Sur
 * téléphone, seule la colonne « Article » reste, avec l'unité et le nombre de dépôts en dessous ; les autres colonnes apparaissent quand la place le permet. Toute la ligne
 * ouvre la fiche (le lien du nom couvre la ligne).
 */
export function ItemsTable({
  items,
  warehouseNames,
  categoryPaths,
  stale,
}: {
  items: Item[]
  warehouseNames: ReadonlyMap<string, string>
  /** Chemin de chaque catégorie : « Électricité › Câbles ». */
  categoryPaths: ReadonlyMap<string, string>
  /** Page précédente affichée pendant le chargement de la suivante. */
  stale: boolean
}) {
  const t = useTranslations()
  const quantity = useQuantityLabel()

  return (
    <Table className={cn("transition-opacity", stale && "opacity-60")}>
      <TableHeader className="bg-muted/40">
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-4">{t("items.table.item")}</TableHead>
          <TableHead className="hidden lg:table-cell">
            {t("items.table.reference")}
          </TableHead>
          <TableHead className="hidden md:table-cell">
            {t("items.table.unit")}
          </TableHead>
          <TableHead className="hidden xl:table-cell">
            {t("items.table.packagings")}
          </TableHead>
          <TableHead className="hidden md:table-cell">
            {t("items.table.warehouses")}
          </TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const names = item.warehouses.flatMap(
            (placement) => warehouseNames.get(placement.warehouseId) ?? []
          )
          const category = item.categoryId
            ? categoryPaths.get(item.categoryId)
            : undefined
          return (
            <TableRow key={item.id} className="relative cursor-pointer">
              <TableCell className="py-2.5 pl-4 whitespace-normal">
                <div className="flex items-center gap-3">
                  <ItemThumb imageUrl={item.imageUrl} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ItemLink
                        itemId={item.id}
                        stretched
                        className="truncate font-medium hover:underline"
                      >
                        {item.name}
                      </ItemLink>
                      {item.status === CatalogStatus.archived && (
                        <Badge variant="secondary">
                          {t("items.restore.badge")}
                        </Badge>
                      )}
                    </div>
                    {category && (
                      <p className="truncate text-xs text-muted-foreground">
                        {category}
                      </p>
                    )}
                    <p className="truncate text-xs text-muted-foreground md:hidden">
                      {t(`units.${item.baseUnit}.label`)} ·{" "}
                      {t("items.warehouseCount", {
                        count: item.warehouses.length,
                      })}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden num text-xs lg:table-cell">
                {item.reference ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {t(`units.${item.baseUnit}.label`)}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {item.packagings.length === 0 ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <ul className="space-y-0.5">
                    {item.packagings.map((packaging) => (
                      <li key={packaging.name}>
                        {packaging.name}{" "}
                        <span className="text-muted-foreground">
                          · {quantity(item.baseUnit, packaging.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {names.length === 0 ? (
                  <span className="text-muted-foreground">
                    {t("items.warehouseCount", { count: 0 })}
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {names.slice(0, VISIBLE_WAREHOUSES).map((name) => (
                      <Badge
                        key={name}
                        variant="outline"
                        className="font-normal"
                      >
                        {name}
                      </Badge>
                    ))}
                    {names.length > VISIBLE_WAREHOUSES && (
                      <Badge variant="secondary">
                        {t("items.moreWarehouses", {
                          count: names.length - VISIBLE_WAREHOUSES,
                        })}
                      </Badge>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell className="pr-4 text-muted-foreground">
                <ChevronRightIcon className="size-4" aria-hidden />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export function ItemsTableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="hidden h-4 w-24 md:block" />
          <Skeleton className="hidden h-4 w-32 lg:block" />
        </div>
      ))}
    </div>
  )
}
