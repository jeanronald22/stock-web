"use client"

import {
  ArrowRightIcon,
  BarcodeIcon,
  LayersIcon,
  PackageIcon,
  WarehouseIcon,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { useCategoryTree } from "@/components/categories/use-category-tree"
import { StockLevelBadge } from "@/components/stock/stock-state-badge"
import { Badge } from "@/components/ui/badge"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Skeleton } from "@/components/ui/skeleton"
import { CatalogStatus, type Item, type Warehouse } from "@/lib/api/stock"
import { useItem, useWarehouses } from "@/lib/api/stock-queries"
import { useItemStock } from "@/lib/api/voucher-queries"
import type { ItemStock } from "@/lib/api/vouchers"
import { RecordRoutes } from "@/lib/routes"
import { cn } from "@/lib/utils"

import { usePackagingBreakdown, useQuantityLabel } from "./describe"
import { ItemThumb } from "./item-thumb"
import { useItemWarehouses } from "./use-item-warehouses"

/** Le temps de passer sur un nom sans le viser : l'aperçu n'ouvre pas au moindre survol. */
const OPEN_DELAY_MS = 400
const CLOSE_DELAY_MS = 150

/**
 * Lien vers la fiche d'un article, partout dans l'application. Au survol (souris, clavier), un
 * aperçu : photo, stock, dépôts, de quoi le reconnaître, sans quitter l'écran. Au toucher, le
 * lien ouvre la fiche. [stretched] : toute la ligne (relative) ouvre la fiche, mais seul le nom
 * ouvre l'aperçu.
 */
export function ItemLink({
  itemId,
  stretched = false,
  className,
  children,
}: {
  itemId: string
  stretched?: boolean
  className?: string
  children: React.ReactNode
}) {
  const href = RecordRoutes.item(itemId)
  return (
    <>
      {stretched && (
        <Link
          href={href}
          aria-hidden
          tabIndex={-1}
          className="absolute inset-0"
        />
      )}
      <HoverCard>
        <HoverCardTrigger
          delay={OPEN_DELAY_MS}
          closeDelay={CLOSE_DELAY_MS}
          render={<Link href={href} />}
          className={cn(stretched && "relative", className)}
        >
          {children}
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-80 rounded-2xl p-0">
          <ItemPreview itemId={itemId} />
        </HoverCardContent>
      </HoverCard>
    </>
  )
}

/** Chargé à l'ouverture seulement : une liste de 50 articles ne lit pas 50 fiches. */
function ItemPreview({ itemId }: { itemId: string }) {
  const item = useItem(itemId)
  const stock = useItemStock(itemId)
  const warehouses = useWarehouses()
  if (!item.data || !stock.data || !warehouses.data)
    return (
      <div className="space-y-3 p-4" aria-busy>
        <div className="flex gap-3">
          <Skeleton className="size-14 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-16" />
      </div>
    )
  return (
    <ItemPreviewBody
      item={item.data}
      stock={stock.data}
      warehouses={warehouses.data}
    />
  )
}

function ItemPreviewBody({
  item,
  stock,
  warehouses,
}: {
  item: Item
  stock: ItemStock
  warehouses: Warehouse[]
}) {
  const t = useTranslations("items")
  const tUnits = useTranslations("units")
  const quantityLabel = useQuantityLabel()
  const { nodes } = useCategoryTree()
  const category = nodes.find((node) => node.category.id === item.categoryId)
  const { lines, total, state, alerts } = useItemWarehouses(
    item,
    warehouses,
    stock
  )
  const packs = usePackagingBreakdown()(item, total)

  return (
    <div>
      <div className="flex gap-3 p-4 pb-3">
        <ItemThumb imageUrl={item.imageUrl} size="lg" />
        <div className="min-w-0">
          <p className="line-clamp-2 font-semibold">{item.name}</p>
          {item.reference && (
            <p className="num text-xs text-muted-foreground">
              {item.reference}
            </p>
          )}
          {category && (
            <p className="truncate text-xs text-muted-foreground">
              {category.path}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 px-4">
        <StockLevelBadge state={state} quantity={total} />
        {item.status === CatalogStatus.archived && (
          <Badge variant="secondary">{t("restore.badge")}</Badge>
        )}
      </div>
      <ul className="space-y-1.5 px-4 pt-3 pb-4 text-sm">
        <PreviewFact icon={PackageIcon}>
          <span className="num font-medium">
            {quantityLabel(item.baseUnit, total)}
          </span>
          {packs && (
            <span className="num text-muted-foreground"> · {packs}</span>
          )}
        </PreviewFact>
        <PreviewFact icon={WarehouseIcon}>
          {t("preview.warehouses", { count: lines.length })}
          {alerts > 0 && (
            <span className="text-warning-muted-foreground">
              {" · "}
              {t("preview.alerts", { count: alerts })}
            </span>
          )}
        </PreviewFact>
        {item.barcode && (
          <PreviewFact icon={BarcodeIcon}>
            <span className="num">{item.barcode}</span>
          </PreviewFact>
        )}
        <PreviewFact icon={LayersIcon}>
          {t("preview.countedIn", {
            unit: tUnits(`${item.baseUnit}.label`),
          })}
          {item.batchTracking && ` · ${t("detail.byBatch")}`}
        </PreviewFact>
      </ul>
      <Link
        href={RecordRoutes.item(item.id)}
        className="flex items-center gap-1 border-t px-4 py-3 text-sm font-semibold text-primary hover:bg-muted/40"
      >
        {t("preview.open")}
        <ArrowRightIcon className="size-4" aria-hidden />
      </Link>
    </div>
  )
}

function PreviewFact({
  icon: Icon,
  children,
}: {
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <li className="flex items-start gap-2">
      <Icon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <span className="min-w-0">{children}</span>
    </li>
  )
}
