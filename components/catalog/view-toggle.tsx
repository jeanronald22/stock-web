"use client"

import { LayoutGridIcon, ListIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ListView } from "@/lib/list/use-list-params"
import { cn } from "@/lib/utils"

/** Liste dense ou grille de cartes (photos en grand) : le même contenu, deux façons de le parcourir. */
export function ViewToggle({
  value,
  onChange,
  className,
}: {
  value: ListView
  onChange: (view: ListView) => void
  className?: string
}) {
  const t = useTranslations("catalog.view")
  return (
    <ToggleGroup
      aria-label={t("label")}
      variant="outline"
      spacing={0}
      className={cn("shrink-0 sm:order-last sm:ml-auto", className)}
      value={[value]}
      onValueChange={(values: string[]) => {
        const next = Object.values(ListView).find((view) => view === values[0])
        if (next) onChange(next)
      }}
    >
      <ToggleGroupItem
        value={ListView.list}
        aria-label={t("list")}
        className="h-11 px-3"
      >
        <ListIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        value={ListView.grid}
        aria-label={t("grid")}
        className="h-11 px-3"
      >
        <LayoutGridIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
