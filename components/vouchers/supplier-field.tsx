"use client"

import { PlusIcon, SearchIcon, TruckIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useDeferredValue, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { CatalogStatus } from "@/lib/api/stock"
import { useSaveSupplier, useSuppliersPage } from "@/lib/api/supplier-queries"
import type { Supplier } from "@/lib/api/suppliers"
import { useErrorMessage } from "@/lib/api/use-error-message"

const RESULTS = 6

export type ChosenSupplier = Pick<Supplier, "id" | "name">

/**
 * Fournisseur d'une réception : recherche dans l'annuaire, ou création à la volée d'un nom
 * nouveau, sans quitter la réception.
 */
export function SupplierField({
  value,
  onChange,
}: {
  value: ChosenSupplier | null
  onChange: (supplier: ChosenSupplier | null) => void
}) {
  const t = useTranslations("vouchers.form")
  const errorMessage = useErrorMessage()
  const save = useSaveSupplier()
  const [text, setText] = useState("")
  const deferred = useDeferredValue(text.trim())
  const search = useMemo(
    () => ({ text: deferred || undefined, status: CatalogStatus.active }),
    [deferred]
  )
  const results = useSuppliersPage(search, 0, RESULTS)

  if (value) {
    return (
      <div className="flex h-11 items-center gap-2 rounded-lg border bg-primary/5 px-3">
        <TruckIcon className="size-5 text-primary" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-medium">
          {value.name}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("changeSupplier")}
          onClick={() => onChange(null)}
        >
          <XIcon />
        </Button>
      </div>
    )
  }

  const typed = text.trim()
  const suppliers = results.data?.items ?? []
  const exists = suppliers.some(
    (supplier) =>
      supplier.name.toLocaleLowerCase() === typed.toLocaleLowerCase()
  )
  const create = () =>
    save.mutate(
      { id: crypto.randomUUID(), input: { name: typed, itemIds: [] } },
      {
        onSuccess: (supplier) => {
          toast.success(t("supplierCreated", { name: supplier.name }))
          setText("")
          onChange(supplier)
        },
        onError: (error) => toast.error(errorMessage(error)),
      }
    )

  return (
    <div className="relative">
      <InputGroup>
        <InputGroupInput
          id="supplier"
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t("supplierSearch")}
          aria-label={t("supplier")}
        />
        <InputGroupAddon>
          {results.isFetching || save.isPending ? <Spinner /> : <SearchIcon />}
        </InputGroupAddon>
      </InputGroup>
      {typed && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg">
          {suppliers.map((supplier) => (
            <li key={supplier.id}>
              <button
                type="button"
                onClick={() => {
                  setText("")
                  onChange(supplier)
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                <TruckIcon
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{supplier.name}</span>
              </button>
            </li>
          ))}
          {!exists && results.isSuccess && (
            <li>
              <button
                type="button"
                onClick={create}
                disabled={save.isPending}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-primary hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                <PlusIcon className="size-4" aria-hidden />
                {t("addSupplier", { name: typed })}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
