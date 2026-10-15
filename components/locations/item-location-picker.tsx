"use client"

import { MapPinIcon, PlusIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { CatalogStatus, StockLimits, type LocationRef } from "@/lib/api/stock"
import {
  useChangeItemLocation,
  useLocations,
  useSaveLocation,
} from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"

import { LocationLabel } from "./location-label"

/**
 * Emplacement habituel d'un article dans un dépôt (D37) : choisi dans la liste du dépôt, ou créé
 * sur place quand le code tapé n'existe pas encore. Sans le droit, il s'affiche seulement.
 */
export function ItemLocationPicker({
  itemId,
  itemName,
  warehouseId,
  location,
  editable,
}: {
  itemId: string
  itemName: string
  warehouseId: string
  location: LocationRef | null
  editable: boolean
}) {
  const t = useTranslations("locations.picker")
  const errorMessage = useErrorMessage()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  // La liste du dépôt n'est lue qu'à l'ouverture.
  const locations = useLocations(open ? warehouseId : undefined)
  const save = useSaveLocation()
  const change = useChangeItemLocation()
  const busy = save.isPending || change.isPending

  if (!editable) return location ? <LocationLabel location={location} /> : null

  const active = (locations.data ?? []).filter(
    (candidate) => candidate.status === CatalogStatus.active
  )
  const typed = search.trim()
  const exists = active.some(
    (candidate) => candidate.code.toLowerCase() === typed.toLowerCase()
  )
  const canCreate =
    !!typed && !exists && typed.length <= StockLimits.locationCode

  const place = async (locationId: string | null) => {
    try {
      await change.mutateAsync({ itemId, warehouseId, locationId })
      setOpen(false)
      setSearch("")
    } catch (failure) {
      toast.error(errorMessage(failure))
    }
  }
  const createAndPlace = async () => {
    const id = crypto.randomUUID()
    try {
      await save.mutateAsync({ id, warehouseId, input: { code: typed } })
    } catch (failure) {
      return toast.error(errorMessage(failure))
    }
    await place(id)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-auto max-w-full justify-start px-2 py-1 font-normal"
            aria-label={t("trigger", { item: itemName })}
          />
        }
      >
        {location ? (
          <LocationLabel location={location} />
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <MapPinIcon className="size-3.5" aria-hidden />
            {t("none")}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={t("search")}
            aria-label={t("search")}
          />
          <CommandList>
            {locations.isPending ? (
              <div className="flex justify-center p-4">
                <Spinner />
              </div>
            ) : (
              <>
                <CommandEmpty>{canCreate ? null : t("empty")}</CommandEmpty>
                {active.length > 0 && (
                  <CommandGroup>
                    {active.map((candidate) => (
                      <CommandItem
                        key={candidate.id}
                        value={`${candidate.code} ${candidate.label ?? ""}`}
                        data-checked={candidate.id === location?.id}
                        disabled={busy}
                        onSelect={() => void place(candidate.id)}
                      >
                        <LocationLabel location={candidate} />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {(canCreate || location) && <CommandSeparator />}
                <CommandGroup>
                  {canCreate && (
                    <CommandItem
                      value={`+ ${typed}`}
                      disabled={busy}
                      onSelect={() => void createAndPlace()}
                    >
                      {busy ? <Spinner /> : <PlusIcon />}
                      {t("create", { code: typed })}
                    </CommandItem>
                  )}
                  {location && (
                    <CommandItem
                      value={t("clear")}
                      disabled={busy}
                      onSelect={() => void place(null)}
                    >
                      <XIcon />
                      {t("clear")}
                    </CommandItem>
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
