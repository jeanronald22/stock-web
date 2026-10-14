"use client"

import { PackagePlusIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { ItemThumb } from "@/components/items/item-thumb"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { ItemPicker } from "@/components/vouchers/item-picker"
import { useCountLine } from "@/lib/api/inventory-queries"
import type { Item } from "@/lib/api/stock"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { parseQuantity } from "@/lib/forms/quantity"

const NO_ITEMS: ReadonlySet<string> = new Set()

/**
 * Article trouvé hors de la feuille (D32) : on le choisit dans le catalogue, avec son lot s'il en a,
 * et on le compte ; il rejoint la feuille.
 */
export function FoundItemSheet({ inventoryId }: { inventoryId: string }) {
  const t = useTranslations("inventory.found")
  const tUnits = useTranslations("units")
  const errorMessage = useErrorMessage()
  const count = useCountLine(inventoryId)
  const [open, setOpen] = useState(false)
  const [item, setItem] = useState<Item | null>(null)
  const [batch, setBatch] = useState("")
  const [quantity, setQuantity] = useState("")
  const entered = parseQuantity(quantity)
  const ready =
    !!item &&
    entered !== null &&
    entered >= 0 &&
    (!item.batchTracking || !!batch.trim())

  const reset = () => {
    setItem(null)
    setBatch("")
    setQuantity("")
  }

  const submit = () => {
    if (!item || entered === null) return
    count.mutate(
      {
        itemId: item.id,
        quantity: entered,
        batch: item.batchTracking ? batch.trim() : undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("done", { name: item.name }))
          reset()
          setOpen(false)
        },
        onError: (error) => toast.error(errorMessage(error)),
      }
    )
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <SheetTrigger render={<Button variant="outline" />}>
        <PackagePlusIcon />
        {t("open")}
      </SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
          {item ? (
            <div className="flex items-center gap-3 rounded-xl border p-3">
              <ItemThumb imageUrl={item.imageUrl} size="sm" />
              <span className="min-w-0 flex-1 truncate font-semibold">
                {item.name}
              </span>
              <Button variant="ghost" size="sm" onClick={reset}>
                {t("change")}
              </Button>
            </div>
          ) : (
            <ItemPicker autoFocus excludedIds={NO_ITEMS} onPick={setItem} />
          )}
          {item?.batchTracking && (
            <Field>
              <FieldLabel htmlFor="found-batch">{t("batch")}</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="found-batch"
                  value={batch}
                  onChange={(event) => setBatch(event.target.value)}
                />
              </InputGroup>
            </Field>
          )}
          {item && (
            <Field>
              <FieldLabel htmlFor="found-quantity">
                {t("quantity", { unit: tUnits(`${item.baseUnit}.label`) })}
              </FieldLabel>
              <InputGroup className="w-40">
                <InputGroupInput
                  id="found-quantity"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </InputGroup>
            </Field>
          )}
        </div>
        <SheetFooter className="border-t">
          <Button
            size="lg"
            disabled={!ready || count.isPending}
            onClick={submit}
          >
            {count.isPending && <Spinner />}
            {t("submit")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
