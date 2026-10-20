"use client"

import { FilterXIcon, SlidersHorizontalIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Children, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

/**
 * Contrôle d'un filtre : pleine largeur dans le panneau, compact à partir de la tablette. Sur
 * téléphone, la hauteur reste celle d'une cible tactile.
 */
export const FILTER_CONTROL =
  "w-full sm:h-9 sm:text-sm sm:data-[size=default]:h-9"

/** Au-delà, les filtres passent dans le menu « Filtres » : la barre reste une seule ligne courte. */
const INLINE_FILTERS_MAX = 2

/**
 * Barre des listes : la recherche (ou la période) et l'affichage toujours à portée. Peu de filtres : sur la même
 * ligne à partir de la tablette. Davantage : derrière « Filtres », qui dit combien sont posés. Sur
 * téléphone, toujours dans un panneau du bas, pour que la liste commence en haut de l'écran. Les
 * filtres sont contrôlés par l'adresse : leurs emplacements restent d'accord.
 */
export function FilterBar({
  lead,
  trailing,
  activeCount,
  onClear,
  children,
  className,
  ...props
}: {
  /** Toujours visible, en tête : la recherche, ou la période des bons. */
  lead?: React.ReactNode
  /** Toujours visible, en fin de barre : l'ordre, le choix grille ou liste. */
  trailing?: React.ReactNode
  /** Filtres posés hors recherche. */
  activeCount: number
  /** Efface les filtres ; absent, la barre n'en propose pas. */
  onClear?: () => void
  children: React.ReactNode
  className?: string
} & Record<`data-${string}`, string>) {
  const t = useTranslations("catalog.filters")
  const [sheetOpen, setSheetOpen] = useState(false)
  const inline = Children.toArray(children).length <= INLINE_FILTERS_MAX
  const active = activeCount > 0

  const trigger = (extra: string) => ({
    variant: "outline" as const,
    className: cn(extra, active && "border-primary/50 bg-primary/5"),
    "aria-label": t("open", { count: activeCount }),
  })
  const count = active && (
    <Badge className="h-5 min-w-5 px-1.5 tabular-nums">{activeCount}</Badge>
  )

  return (
    <div
      data-slot="filter-bar"
      className={cn("mt-6 flex flex-wrap items-center gap-2", className)}
      {...props}
    >
      {lead && (
        <div className="min-w-0 flex-1 sm:max-w-xs sm:min-w-56 sm:*:h-9 sm:[&_input]:text-sm">
          {lead}
        </div>
      )}

      <Button
        size="lg"
        {...trigger("h-11 px-3 sm:hidden")}
        onClick={() => setSheetOpen(true)}
      >
        <SlidersHorizontalIcon />
        {/* Seul en tête de barre, le bouton a la place d'écrire son nom. */}
        {!lead && t("title")}
        {count}
      </Button>

      {inline ? (
        <div className="hidden sm:contents sm:*:w-52">{children}</div>
      ) : (
        <Popover>
          <PopoverTrigger
            render={<Button {...trigger("hidden h-9 sm:inline-flex")} />}
          >
            <SlidersHorizontalIcon />
            {t("title")}
            {count}
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-96 gap-3 rounded-xl p-3"
            aria-label={t("title")}
          >
            <p className="px-1 label-caps">{t("title")}</p>
            <div className="flex flex-col gap-2">{children}</div>
            {onClear && active && (
              <Button
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={onClear}
              >
                <FilterXIcon />
                {t("clear")}
              </Button>
            )}
          </PopoverContent>
        </Popover>
      )}

      {/* Dans le menu, « Effacer » y est déjà. */}
      {inline && onClear && active && (
        <Button
          variant="ghost"
          className="hidden h-9 sm:inline-flex"
          onClick={onClear}
        >
          <FilterXIcon />
          {t("clear")}
        </Button>
      )}
      {trailing && (
        <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
          {trailing}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] gap-0 rounded-t-2xl sm:hidden"
        >
          <SheetHeader className="border-b">
            <SheetTitle>{t("title")}</SheetTitle>
            <SheetDescription className="sr-only">
              {t("description")}
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
            {children}
          </div>
          <SheetFooter className="flex-row border-t">
            {onClear && (
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={!active}
                onClick={onClear}
              >
                {t("clear")}
              </Button>
            )}
            <Button
              size="lg"
              className="flex-1"
              onClick={() => setSheetOpen(false)}
            >
              {t("apply")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
