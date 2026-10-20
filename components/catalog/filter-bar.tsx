"use client"

import { FilterXIcon, SlidersHorizontalIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
 * Barre des listes : la recherche et l'affichage toujours à portée ; les filtres sur la même ligne
 * à partir de la tablette, dans un panneau du bas sur téléphone, pour que la liste commence en
 * haut de l'écran. Les filtres sont contrôlés par l'adresse : les deux emplacements restent
 * d'accord.
 */
export function FilterBar({
  search,
  trailing,
  activeCount,
  onClear,
  children,
  className,
  ...props
}: {
  search?: React.ReactNode
  /** Toujours visible, en fin de barre : le choix liste ou grille. */
  trailing?: React.ReactNode
  /** Filtres posés hors recherche. */
  activeCount: number
  /** Efface les filtres ; absent, la barre n'en propose pas. */
  onClear?: () => void
  children: React.ReactNode
  className?: string
} & Record<`data-${string}`, string>) {
  const t = useTranslations("catalog.filters")
  const [open, setOpen] = useState(false)
  const clear = onClear && activeCount > 0 && (
    <Button variant="ghost" size="lg" className="h-11" onClick={onClear}>
      <FilterXIcon />
      {t("clear")}
    </Button>
  )

  return (
    <div
      className={cn("mt-6 flex flex-wrap items-center gap-2", className)}
      {...props}
    >
      {search && (
        <div className="min-w-0 flex-1 sm:max-w-md sm:min-w-64">{search}</div>
      )}
      <Button
        variant="outline"
        size="lg"
        className={cn(
          "h-11 px-3 sm:hidden",
          activeCount > 0 && "border-primary/50 bg-primary/5"
        )}
        aria-label={t("open", { count: activeCount })}
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontalIcon />
        {/* Sans recherche à côté, la place ne manque pas : le mot accompagne l'icône. */}
        {!search && t("title")}
        {activeCount > 0 && (
          <Badge className="h-5 min-w-5 px-1.5 tabular-nums">
            {activeCount}
          </Badge>
        )}
      </Button>
      <div className="hidden flex-wrap items-center gap-2 sm:contents">
        {children}
        {clear}
      </div>
      {trailing && <div className="shrink-0 sm:ml-auto">{trailing}</div>}

      <Sheet open={open} onOpenChange={setOpen}>
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
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 [&>*]:w-full">
            {children}
          </div>
          <SheetFooter className="flex-row border-t">
            {onClear && (
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={activeCount === 0}
                onClick={onClear}
              >
                {t("clear")}
              </Button>
            )}
            <Button size="lg" className="flex-1" onClick={() => setOpen(false)}>
              {t("apply")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
