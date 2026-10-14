"use client"

import { PackageIcon, PlusIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form"

import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { StockLimits, type BaseUnit } from "@/lib/api/stock"
import { parseQuantity } from "@/lib/forms/quantity"

import { useQuantityLabel } from "./describe"
import type { ItemFormValues } from "./item-form-schema"

const EMPTY_PACKAGING = { name: "", quantity: "" }

/** Conditionnements de l'article, chacun avec son équivalent en unité de base. */
export function PackagingsField({
  control,
  register,
  errors,
}: {
  control: Control<ItemFormValues>
  register: UseFormRegister<ItemFormValues>
  errors: FieldErrors<ItemFormValues>["packagings"]
}) {
  const t = useTranslations("items.form")
  const tUnits = useTranslations("units")
  const quantityLabel = useQuantityLabel()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "packagings",
  })
  const baseUnit = useWatch({ control, name: "baseUnit" }) as BaseUnit
  const values = useWatch({ control, name: "packagings" })

  return (
    <div className="space-y-3">
      {fields.map((field, index) => {
        const quantity = parseQuantity(values?.[index]?.quantity ?? "")
        const name = values?.[index]?.name?.trim()
        const rowErrors = errors?.[index]
        return (
          <div key={field.id} className="animate-rise-in rounded-xl border p-3">
            <div className="flex items-start gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div>
                  <InputGroup>
                    <InputGroupInput
                      aria-label={t("packagingName")}
                      placeholder={t("packagingNamePlaceholder")}
                      aria-invalid={!!rowErrors?.name}
                      {...register(`packagings.${index}.name`)}
                    />
                    <InputGroupAddon>
                      <PackageIcon />
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldError errors={[rowErrors?.name]} />
                </div>
                <div>
                  <InputGroup>
                    <InputGroupAddon>
                      <InputGroupText>{t("packagingQuantity")}</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      inputMode="decimal"
                      aria-label={t("packagingQuantity")}
                      placeholder="12"
                      aria-invalid={!!rowErrors?.quantity}
                      {...register(`packagings.${index}.quantity`)}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText>
                        {tUnits(`${baseUnit}.label`)}
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldError errors={[rowErrors?.quantity]} />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("removePackaging")}
                onClick={() => remove(index)}
              >
                <XIcon />
              </Button>
            </div>
            {name && quantity !== null && quantity > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                {t("packagingPreview", {
                  name,
                  quantity: quantityLabel(baseUnit, quantity),
                })}
              </p>
            )}
          </div>
        )
      })}
      {fields.length < StockLimits.packagingsPerItem && (
        <Button
          type="button"
          variant="outline"
          onClick={() => append(EMPTY_PACKAGING)}
        >
          <PlusIcon />
          {t("addPackaging")}
        </Button>
      )}
    </div>
  )
}
