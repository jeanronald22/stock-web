"use client"

import { BoxIcon, PlusIcon, SearchIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useDeferredValue, useMemo, useState } from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { CatalogStatus, type Item } from "@/lib/api/stock"
import { useItemsPage } from "@/lib/api/stock-queries"
import { useFileUrl } from "@/lib/api/use-file-url"

const RESULTS = 8

/**
 * Recherche d'un article à ajouter au bon. Pour une sortie, seuls les articles proposés dans le
 * dépôt ([warehouseId]) sont cherchés ; pour une réception, tout le catalogue.
 */
export function ItemPicker({
  warehouseId,
  excludedIds,
  onPick,
  inputRef,
  autoFocus,
}: {
  /** Champ de recherche : la saisie y revient après chaque quantité (touche Entrée). */
  inputRef?: React.Ref<HTMLInputElement>
  autoFocus?: boolean
  warehouseId?: string
  /** Déjà sur le bon (un article suivi par lot peut revenir, pour un autre lot). */
  excludedIds: ReadonlySet<string>
  onPick: (item: Item) => void
}) {
  const t = useTranslations("vouchers.form")
  const fileUrl = useFileUrl()
  const [text, setText] = useState("")
  const deferred = useDeferredValue(text.trim())
  const search = useMemo(
    () => ({
      text: deferred || undefined,
      warehouseId,
      status: CatalogStatus.active,
    }),
    [deferred, warehouseId]
  )
  const results = useItemsPage(search, 0, RESULTS)
  const items = (results.data?.items ?? []).filter(
    (item) => !excludedIds.has(item.id)
  )

  return (
    <div className="rounded-xl border">
      <InputGroup className="rounded-b-none border-0 border-b">
        <InputGroupInput
          ref={inputRef}
          autoFocus={autoFocus}
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t("searchItem")}
          aria-label={t("searchItem")}
        />
        <InputGroupAddon>
          {results.isFetching ? <Spinner /> : <SearchIcon />}
        </InputGroupAddon>
      </InputGroup>
      <ul className="max-h-64 overflow-y-auto p-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => {
                onPick(item)
                setText("")
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              <span
                className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary/10 text-primary"
                aria-hidden
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- lien signé de l'API, hors optimisation Next
                  <img
                    src={fileUrl(item.imageUrl) ?? undefined}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <BoxIcon className="size-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {item.name}
                </span>
                {item.reference && (
                  <span className="block font-mono text-xs text-muted-foreground">
                    {item.reference}
                  </span>
                )}
              </span>
              <PlusIcon className="size-4 text-primary" aria-hidden />
            </button>
          </li>
        ))}
        {results.isSuccess && items.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-muted-foreground">
            {warehouseId ? t("noItemInWarehouse") : t("noItem")}
          </li>
        )}
      </ul>
    </div>
  )
}
