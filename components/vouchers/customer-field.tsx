"use client"

import { PlusIcon, SearchIcon, UserRoundIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useDeferredValue, useMemo, useState } from "react"
import { toast } from "sonner"

import { CustomerKindIcon } from "@/components/customers/customers-screen"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { useCustomersPage, useSaveCustomer } from "@/lib/api/customer-queries"
import {
  customerKinds,
  type Customer,
  type CustomerKind,
} from "@/lib/api/customers"
import { CatalogStatus } from "@/lib/api/stock"
import { useErrorMessage } from "@/lib/api/use-error-message"

const RESULTS = 6

export type ChosenCustomer = Pick<Customer, "id" | "name" | "kind">

/**
 * Client ou chantier d'une sortie (D30) : recherche dans l'annuaire, création à la volée (client
 * ou chantier), ou simple nom pour un passage sans fiche ([counterparty]).
 */
export function CustomerField({
  customer,
  counterparty,
  onCustomerChange,
  onCounterpartyChange,
}: {
  customer: ChosenCustomer | null
  counterparty: string
  onCustomerChange: (customer: ChosenCustomer | null) => void
  onCounterpartyChange: (name: string) => void
}) {
  const t = useTranslations("vouchers.form")
  const errorMessage = useErrorMessage()
  const save = useSaveCustomer()
  const [text, setText] = useState("")
  const deferred = useDeferredValue(text.trim())
  const search = useMemo(
    () => ({ text: deferred || undefined, status: CatalogStatus.active }),
    [deferred]
  )
  const results = useCustomersPage(search, 0, RESULTS)

  if (customer || counterparty) {
    return (
      <div className="flex h-11 items-center gap-2 rounded-lg border bg-primary/5 px-3">
        {customer ? (
          <CustomerKindIcon
            kind={customer.kind}
            className="size-5 text-primary"
          />
        ) : (
          <UserRoundIcon className="size-5 text-primary" aria-hidden />
        )}
        <span className="min-w-0 flex-1 truncate font-medium">
          {customer?.name ?? counterparty}
        </span>
        {!customer && (
          <span className="text-xs text-muted-foreground">
            {t("withoutRecord")}
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("changeCustomer")}
          onClick={() => {
            onCustomerChange(null)
            onCounterpartyChange("")
          }}
        >
          <XIcon />
        </Button>
      </div>
    )
  }

  const typed = text.trim()
  const customers = results.data?.items ?? []
  const exists = customers.some(
    (candidate) =>
      candidate.name.toLocaleLowerCase() === typed.toLocaleLowerCase()
  )
  const create = (kind: CustomerKind) =>
    save.mutate(
      { id: crypto.randomUUID(), input: { kind, name: typed } },
      {
        onSuccess: (created) => {
          toast.success(t("customerCreated", { name: created.name }))
          setText("")
          onCustomerChange(created)
        },
        onError: (error) => toast.error(errorMessage(error)),
      }
    )
  const option =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"

  return (
    <div className="relative">
      <InputGroup>
        <InputGroupInput
          id="customer"
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t("customerSearch")}
          aria-label={t("customer")}
        />
        <InputGroupAddon>
          {results.isFetching || save.isPending ? <Spinner /> : <SearchIcon />}
        </InputGroupAddon>
      </InputGroup>
      {typed && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg">
          {customers.map((candidate) => (
            <li key={candidate.id}>
              <button
                type="button"
                onClick={() => {
                  setText("")
                  onCustomerChange(candidate)
                }}
                className={option}
              >
                <CustomerKindIcon
                  kind={candidate.kind}
                  className="size-4 text-muted-foreground"
                />
                <span className="min-w-0 flex-1 truncate">
                  {candidate.name}
                </span>
              </button>
            </li>
          ))}
          {!exists && results.isSuccess && (
            <>
              {customerKinds.map((kind) => (
                <li key={kind}>
                  <button
                    type="button"
                    onClick={() => create(kind)}
                    disabled={save.isPending}
                    className={`${option} font-medium text-primary`}
                  >
                    <PlusIcon className="size-4" aria-hidden />
                    {t(`addCustomer.${kind}`, { name: typed })}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setText("")
                    onCounterpartyChange(typed)
                  }}
                  className={`${option} text-muted-foreground`}
                >
                  <UserRoundIcon className="size-4" aria-hidden />
                  {t("useWithoutRecord", { name: typed })}
                </button>
              </li>
            </>
          )}
        </ul>
      )}
    </div>
  )
}
