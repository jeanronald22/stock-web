"use client"

import Link from "next/link"
import type { ReactNode } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import type { Item } from "@/lib/api/stock"
import { RecordRoutes } from "@/lib/routes"
import { cn } from "@/lib/utils"

import { ItemThumb } from "./item-thumb"

/**
 * Colonnes de la grille : 2 sur téléphone, puis autant que la largeur en tient. Des cartes de taille
 * fixe : un grand écran montre plus d'articles, pas des photos plus grandes.
 */
export const ITEM_GRID =
  "grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))]"

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
  selection,
}: {
  item: Item
  /** Posé sur la photo, en haut : un état (rupture, archivé). */
  overlay?: ReactNode
  subtitle?: ReactNode
  children?: ReactNode
  /** Rien en stock, archivé : la carte s'efface un peu. */
  muted?: boolean
  /** Mode sélection : la carte coche l'article au lieu d'ouvrir sa fiche. */
  selection?: { selected: boolean; onToggle: () => void; label: string }
}) {
  return (
    <li
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border bg-card transition-colors focus-within:ring-3 focus-within:ring-ring/30 hover:border-foreground/25",
        selection?.selected && "border-primary ring-2 ring-primary/40"
      )}
    >
      {selection && (
        <>
          {/* Toute la carte coche ; la case porte le nom pour le clavier et les lecteurs d'écran. */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={selection.onToggle}
          />
          <Checkbox
            checked={selection.selected}
            onCheckedChange={selection.onToggle}
            aria-label={selection.label}
            className="absolute top-2 right-2 z-20 size-5 bg-background shadow-sm"
          />
        </>
      )}
      <div className="relative">
        <ItemThumb
          imageUrl={item.imageUrl}
          className={cn(
            "aspect-[4/3] size-auto w-full rounded-none [&_svg]:size-8",
            muted && "opacity-60"
          )}
        />
        {overlay && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {overlay}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-2.5">
        {selection ? (
          <span className="line-clamp-2 text-sm leading-snug font-semibold">
            {item.name}
          </span>
        ) : (
          <Link
            href={RecordRoutes.item(item.id)}
            className="line-clamp-2 text-sm leading-snug font-semibold after:absolute after:inset-0 focus-visible:outline-none"
          >
            {item.name}
          </Link>
        )}
        {subtitle && (
          <div className="truncate text-xs text-muted-foreground">
            {subtitle}
          </div>
        )}
        {children && <div className="mt-auto pt-1.5">{children}</div>}
      </div>
    </li>
  )
}

export function ItemGridSkeleton({ cards }: { cards: number }) {
  return (
    <ul className={ITEM_GRID} aria-hidden>
      {Array.from({ length: cards }, (_, index) => (
        <li key={index} className="overflow-hidden rounded-xl border">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-2 p-2.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  )
}
