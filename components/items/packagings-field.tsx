"use client"

import { PackageIcon, PlusIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EntryDirection, StockLimits, type BaseUnit } from "@/lib/api/stock"
import { parseQuantity } from "@/lib/forms/quantity"

import { useQuantityLabel } from "./describe"
import type { ItemFormValues } from "./item-form-schema"

const EMPTY_PACKAGING = {
  name: "",
  quantity: "",
  defaultReceipt: false,
  defaultIssue: false,
}

/** Choix « unité de base » des réglages par défaut : aucun conditionnement n'est proposé d'office. */
const BASE_UNIT_DEFAULT = ""

/** Drapeau du formulaire qui porte le réglage de chaque sens. */
const DEFAULT_FLAGS = {
  [EntryDirection.receipt]: "defaultReceipt",
  [EntryDirection.issue]: "defaultIssue",
} as const

/** Conditionnements de l'article, chacun avec son équivalent en unité de base. */
export function PackagingsField({
  control,
  register,
  setValue,
  errors,
}: {
  control: Control<ItemFormValues>
  register: UseFormRegister<ItemFormValues>
  setValue: UseFormSetValue<ItemFormValues>
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
      <PackagingDefaults
        baseUnit={baseUnit}
        packagings={values ?? []}
        onChange={(direction, index) =>
          (values ?? []).forEach((_, row) =>
            setValue(
              `packagings.${row}.${DEFAULT_FLAGS[direction]}`,
              row === index,
              { shouldDirty: true }
            )
          )
        }
      />
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

/**
 * Conditionnement proposé d'office sur les bons (D36) : « Réceptions en Carton », « Sorties en
 * Pièce ». Affiché dès qu'un conditionnement est nommé ; chaque ligne de bon reste modifiable.
 */
function PackagingDefaults({
  baseUnit,
  packagings,
  onChange,
}: {
  baseUnit: BaseUnit
  packagings: ItemFormValues["packagings"]
  /** [index] : la ligne du conditionnement choisi, -1 pour l'unité de base. */
  onChange: (direction: EntryDirection, index: number) => void
}) {
  const t = useTranslations("items.form.defaults")
  const tUnits = useTranslations("units")
  const named = packagings
    .map((packaging, index) => ({ name: packaging.name.trim(), index }))
    .filter((packaging) => packaging.name)
  if (named.length === 0) return null
  const choices = [
    { value: BASE_UNIT_DEFAULT, label: tUnits(`${baseUnit}.label`) },
    ...named.map((packaging) => ({
      value: String(packaging.index),
      label: packaging.name,
    })),
  ]
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.values(EntryDirection).map((direction) => {
          const chosen = packagings.findIndex(
            (packaging) =>
              packaging.name.trim() && packaging[DEFAULT_FLAGS[direction]]
          )
          const id = `packaging-default-${direction}`
          return (
            <Field key={direction}>
              <FieldLabel htmlFor={id}>{t(`${direction}.label`)}</FieldLabel>
              <Select
                items={choices}
                value={chosen < 0 ? BASE_UNIT_DEFAULT : String(chosen)}
                onValueChange={(value) =>
                  onChange(
                    direction,
                    value && value !== BASE_UNIT_DEFAULT ? Number(value) : -1
                  )
                }
              >
                <SelectTrigger id={id} className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {choices.map((choice) => (
                    <SelectItem key={choice.value} value={choice.value}>
                      {choice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )
        })}
      </div>
      <FieldDescription className="mt-2">{t("hint")}</FieldDescription>
    </div>
  )
}
