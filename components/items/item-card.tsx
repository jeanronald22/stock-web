"use client"

import Link from "next/link"
import type { ReactNode } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import type { Item } from "@/lib/api/stock"
import { RecordRoutes } from "@/lib/routes"
import { cn } from "@/lib/utils"

import { ItemThumb } from "./item-thumb"

/** Colonnes de la grille : 2 sur téléphone, jusqu'à 5 sur grand écran. */
export const ITEM_GRID =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5"

/**
 * Carte d'un article dans une grille : sa photo en grand (c'est elle qui le fait reconnaître dans les
 * rayons), son nom, puis ce que la liste veut en dire ([children]). Toute la carte ouvre la fiche.
 */
export function ItemCard({
  item,
  overlay,
  subtitle,
  children,
  muted = false,
}: {
  item: Item
  /** Posé sur la photo, en haut : un état (rupture, archivé). */
  overlay?: ReactNode
  subtitle?: ReactNode
  children?: ReactNode
  /** Rien en stock, archivé : la carte s'efface un peu. */
  muted?: boolean
}) {
  return (
    <li className="relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-colors focus-within:ring-3 focus-within:ring-ring/30 hover:border-foreground/25">
      <div className="relative">
        <ItemThumb
          imageUrl={item.imageUrl}
          className={cn(
            "aspect-[4/3] size-auto w-full rounded-none [&_svg]:size-10",
            muted && "opacity-60"
          )}
        />
        {overlay && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {overlay}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link
          href={RecordRoutes.item(item.id)}
          className="line-clamp-2 leading-snug font-semibold after:absolute after:inset-0 focus-visible:outline-none"
        >
          {item.name}
        </Link>
        {subtitle && (
          <div className="truncate text-xs text-muted-foreground">
            {subtitle}
          </div>
        )}
        {children && <div className="mt-auto pt-2">{children}</div>}
      </div>
    </li>
  )
}

export function ItemGridSkeleton({ cards }: { cards: number }) {
  return (
    <ul className={ITEM_GRID} aria-hidden>
      {Array.from({ length: cards }, (_, index) => (
        <li key={index} className="overflow-hidden rounded-2xl border">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  )
}
