"use client"

import { BoxesIcon, ChevronDownIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useDeferredValue, useMemo, useState } from "react"

import { ItemThumb } from "@/components/items/item-thumb"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { CatalogStatus } from "@/lib/api/stock"
import { useItem, useItemsPage } from "@/lib/api/stock-queries"
import { cn } from "@/lib/utils"

import { FILTER_CONTROL } from "./filter-bar"

const RESULTS = 8

/**
 * Filtre par article : tous, ou un seul, cherché par nom, référence ou code-barres. L'article choisi
 * se relit par son identifiant (l'adresse ne garde que lui).
 */
export function ItemFilter({
  value,
  onChange,
  className,
}: {
  value: string | undefined
  onChange: (itemId: string | undefined) => void
  className?: string
}) {
  const t = useTranslations("catalog")
  const [open, setOpen] = useState(false)
  const chosen = useItem(value)

  const choose = (itemId: string | undefined) => {
    onChange(itemId)
    setOpen(false)
  }

  return (
    <div className={cn("flex items-center", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="lg"
              className={cn(
                FILTER_CONTROL,
                "h-11 min-w-0 flex-1 justify-start px-3.5 text-base font-normal",
                value &&
                  "rounded-r-none border-r-0 border-primary/50 bg-primary/5"
              )}
              aria-label={t("itemFilter")}
            />
          }
        >
          <BoxesIcon className="size-5 text-muted-foreground" aria-hidden />
          <span className="truncate">
            {!value
              ? t("allItems")
              : (chosen.data?.name ?? t("itemFilterLoading"))}
          </span>
          <ChevronDownIcon
            className="ml-auto size-4 text-muted-foreground"
            aria-hidden
          />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0">
          {/* Monté à l'ouverture seulement : la recherche ne part pas avant. */}
          <ItemResults value={value} onChoose={choose} />
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          variant="outline"
          size="icon-lg"
          className="size-11 rounded-l-none border-primary/50 bg-primary/5 sm:size-9"
          aria-label={t("itemFilterClear")}
          onClick={() => choose(undefined)}
        >
          <XIcon />
        </Button>
      )}
    </div>
  )
}

function ItemResults({
  value,
  onChoose,
}: {
  value: string | undefined
  onChoose: (itemId: string | undefined) => void
}) {
  const t = useTranslations("catalog")
  const [text, setText] = useState("")
  const deferred = useDeferredValue(text.trim())
  const search = useMemo(
    () => ({ text: deferred || undefined, status: CatalogStatus.active }),
    [deferred]
  )
  const results = useItemsPage(search, 0, RESULTS)
  return (
    <Command shouldFilter={false}>
      <CommandInput
        value={text}
        onValueChange={setText}
        placeholder={t("itemFilterSearch")}
        aria-label={t("itemFilterSearch")}
      />
      <CommandList>
        {results.isPending ? (
          <div className="flex justify-center p-4">
            <Spinner />
          </div>
        ) : (
          <>
            <CommandEmpty>{t("itemFilterEmpty")}</CommandEmpty>
            <CommandGroup>
              {!deferred && value && (
                <CommandItem value="all" onSelect={() => onChoose(undefined)}>
                  {t("allItems")}
                </CommandItem>
              )}
              {(results.data?.items ?? []).map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  data-checked={item.id === value}
                  onSelect={() => onChoose(item.id)}
                >
                  <ItemThumb imageUrl={item.imageUrl} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{item.name}</span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {item.reference}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  )
}
