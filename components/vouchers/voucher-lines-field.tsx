"use client"

import { XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import {
  Controller,
  useFieldArray,
  useWatch,
  type UseFormReturn,
} from "react-hook-form"

import { useQuantityLabel } from "@/components/items/describe"
import { ItemThumb } from "@/components/items/item-thumb"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { incomingTypes, VoucherType, type EntryType } from "@/lib/api/vouchers"
import { useItemStock } from "@/lib/api/voucher-queries"
import { parseQuantity } from "@/lib/forms/quantity"

import { ItemPicker } from "./item-picker"
import {
  BASE_UNIT_CHOICE,
  baseQuantity,
  newLine,
  type VoucherFormValues,
} from "./voucher-form-schema"

type FieldProps = { form: UseFormReturn<VoucherFormValues>; type: EntryType }

/** Entrée dans une quantité : retour à la recherche, pour enchaîner l'article suivant. */
type LineNavigation = { searchRef: React.RefObject<HTMLInputElement | null> }

/**
 * Articles du bon, au clavier : chercher, ajouter (le curseur passe à la quantité), Entrée pour
 * revenir à la recherche. Une ligne par article : quantité, unité ou conditionnement, lot.
 */
export function VoucherLinesField({
  form,
  type,
  searchRef,
  supplier,
}: FieldProps &
  LineNavigation & { supplier?: { id: string; name: string } | null }) {
  const t = useTranslations("vouchers.form")
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
    keyName: "fieldKey",
  })
  const warehouseId = useWatch({ control: form.control, name: "warehouseId" })
  const lines = useWatch({ control: form.control, name: "lines" })
  // Un article suivi par lot peut revenir sur le bon, pour un autre lot.
  const excluded = new Set(
    (lines ?? [])
      .filter((line) => !line.item.batchTracking)
      .map((line) => line.itemId)
  )
  const rootError =
    form.formState.errors.lines?.root ?? form.formState.errors.lines
  // Réception : la quantité annoncée par le bon de livraison, ligne par ligne, pour voir l'écart.
  const [compare, setCompare] = useState(false)
  const toggleCompare = (on: boolean) => {
    setCompare(on)
    if (!on)
      form
        .getValues("lines")
        .forEach((_, index) => form.setValue(`lines.${index}.expected`, ""))
  }

  return (
    <div className="space-y-4">
      {type === VoucherType.receipt && (
        <Field orientation="horizontal" className="rounded-xl border p-3">
          <FieldContent>
            <FieldLabel htmlFor="compare-delivery-note">
              {t("compare")}
            </FieldLabel>
            <FieldDescription>{t("compareHint")}</FieldDescription>
          </FieldContent>
          <Switch
            id="compare-delivery-note"
            checked={compare}
            onCheckedChange={toggleCompare}
          />
        </Field>
      )}
      <ItemPicker
        inputRef={searchRef}
        autoFocus
        supplier={supplier}
        warehouseId={incomingTypes.has(type) ? undefined : warehouseId}
        excludedIds={excluded}
        onPick={(item) =>
          append(newLine(item), {
            focusName: `lines.${fields.length}.quantity`,
          })
        }
      />
      <p
        className="text-sm font-medium text-muted-foreground"
        aria-live="polite"
      >
        {t("addedLines", { count: fields.length })}
      </p>
      <ul className="space-y-3">
        {fields.map((field, index) => (
          <VoucherLineRow
            key={field.fieldKey}
            form={form}
            type={type}
            index={index}
            searchRef={searchRef}
            compare={compare}
            onRemove={() => remove(index)}
          />
        ))}
      </ul>
      {rootError && "message" in rootError && (
        <FieldError errors={[rootError as { message?: string }]} />
      )}
    </div>
  )
}

function VoucherLineRow({
  form,
  type,
  index,
  searchRef,
  compare,
  onRemove,
}: FieldProps &
  LineNavigation & { index: number; compare: boolean; onRemove: () => void }) {
  const t = useTranslations()
  const quantityLabel = useQuantityLabel()
  const line = useWatch({ control: form.control, name: `lines.${index}` })
  const warehouseId = useWatch({ control: form.control, name: "warehouseId" })
  const errors = form.formState.errors.lines?.[index]
  // Le stock part du dépôt (sortie, transfert, casse) ou y est compté : le disponible s'affiche.
  const issue = !incomingTypes.has(type)
  const stock = useItemStock(issue ? line.itemId : undefined)
  const inWarehouse = stock.data?.warehouses.find(
    (entry) => entry.warehouse.id === warehouseId
  )

  const adjustment = type === VoucherType.adjustment
  const entered = parseQuantity(line.quantity)
  const inBase = (value: number) => baseQuantity(line.item, value, line.unit)
  const expected = compare ? parseQuantity(line.expected) : null
  const converted =
    entered !== null && entered > 0 && line.unit !== BASE_UNIT_CHOICE
      ? baseQuantity(line.item, entered, line.unit)
      : null
  // Champ fermé : le nom seul (la conversion s'affiche sous la ligne) ; liste : avec le contenu.
  const unitItems = [
    {
      value: BASE_UNIT_CHOICE,
      label: t(`units.${line.item.baseUnit}.label`),
      detail: "",
    },
    ...line.item.packagings.map((packaging) => ({
      value: packaging.name,
      label: packaging.name,
      detail: ` (${quantityLabel(line.item.baseUnit, packaging.quantity)})`,
    })),
  ]
  const batchItems = (inWarehouse?.batches ?? []).map((batch) => ({
    value: batch.batch ?? "",
    label: `${batch.batch} · ${quantityLabel(line.item.baseUnit, batch.quantity)}`,
  }))
  // Écart affiché avant validation : compté − théorique (ajustement), reçu − annoncé (réception).
  const available = line.item.batchTracking
    ? inWarehouse?.batches.find((batch) => batch.batch === line.batch)?.quantity
    : inWarehouse?.quantity
  const reference = adjustment
    ? stock.isSuccess
      ? (available ?? 0)
      : null
    : expected !== null
      ? inBase(expected)
      : null
  const gap =
    entered !== null && reference !== null ? inBase(entered) - reference : null

  const quantityField = form.register(`lines.${index}.quantity`)
  const quantityText = adjustment
    ? t("vouchers.form.counted")
    : t("vouchers.form.quantity")
  const batchInput = line.item.batchTracking && !issue

  return (
    <li className="animate-rise-in rounded-xl border p-3">
      <div className="grid gap-2 md:grid-cols-[minmax(0,1.2fr)_6.5rem_minmax(11rem,1.2fr)_minmax(0,1fr)_auto] md:items-start">
        <div className="flex min-h-11 items-center justify-between gap-2 md:pr-2">
          <span className="flex min-w-0 items-center gap-3">
            <ItemThumb imageUrl={line.item.imageUrl} size="sm" />
            <span className="min-w-0 truncate font-semibold">
              {line.item.name}
            </span>
          </span>
          {/* Téléphone : le retrait à côté du nom, sans ligne à lui seul. */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={`${t("vouchers.form.remove")} · ${line.item.name}`}
            onClick={onRemove}
          >
            <XIcon />
          </Button>
        </div>
        <div>
          <InputGroupInputBox>
            <InputGroupInput
              inputMode="decimal"
              placeholder={quantityText}
              aria-label={`${quantityText} · ${line.item.name}`}
              aria-invalid={!!errors?.quantity}
              {...quantityField}
              onKeyDown={(event) => {
                if (event.key !== ENTER) return
                event.preventDefault()
                searchRef.current?.focus()
              }}
            />
          </InputGroupInputBox>
        </div>
        {unitItems.length > 1 ? (
          <Controller
            control={form.control}
            name={`lines.${index}.unit`}
            render={({ field }) => (
              <Select
                items={unitItems}
                value={field.value}
                onValueChange={(value) =>
                  field.onChange(value ?? BASE_UNIT_CHOICE)
                }
              >
                <SelectTrigger
                  className="w-full"
                  aria-label={`${t("vouchers.form.unit")} · ${line.item.name}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                      {item.detail}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        ) : (
          <div className="flex h-11 items-center rounded-lg border bg-muted/40 px-3.5 text-muted-foreground">
            {unitItems[0].label}
          </div>
        )}
        <div>
          {line.item.batchTracking &&
            (batchInput ? (
              <InputGroupInputBox>
                <InputGroupInput
                  placeholder={`${t("vouchers.form.batch")} : ${t("vouchers.form.batchPlaceholder")}`}
                  aria-label={`${t("vouchers.form.batch")} · ${line.item.name}`}
                  aria-invalid={!!errors?.batch}
                  {...form.register(`lines.${index}.batch`)}
                />
              </InputGroupInputBox>
            ) : (
              <Controller
                control={form.control}
                name={`lines.${index}.batch`}
                render={({ field }) => (
                  <Select
                    items={batchItems}
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-label={`${t("vouchers.form.batch")} · ${line.item.name}`}
                      aria-invalid={!!errors?.batch}
                    >
                      <SelectValue
                        placeholder={t("vouchers.form.chooseBatch")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {batchItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden justify-self-end md:inline-flex"
          aria-label={`${t("vouchers.form.remove")} · ${line.item.name}`}
          onClick={onRemove}
        >
          <XIcon />
        </Button>
      </div>
      {compare && (
        <div className="mt-2 flex items-center gap-3 md:max-w-xs">
          <label
            htmlFor={`expected-${index}`}
            className="shrink-0 text-sm text-muted-foreground"
          >
            {t("vouchers.form.announced")}
          </label>
          <InputGroupInputBox>
            <InputGroupInput
              id={`expected-${index}`}
              inputMode="decimal"
              aria-label={`${t("vouchers.form.announced")} · ${line.item.name}`}
              aria-invalid={!!errors?.expected}
              {...form.register(`lines.${index}.expected`)}
            />
          </InputGroupInputBox>
        </div>
      )}
      <div className="mt-1 flex flex-wrap gap-x-4 text-sm">
        <FieldError errors={[errors?.quantity]} />
        <FieldError errors={[errors?.batch]} />
        <FieldError errors={[errors?.expected]} />

        {converted !== null && (
          <span className="text-muted-foreground">
            {t("vouchers.form.converted", {
              quantity: quantityLabel(line.item.baseUnit, converted),
            })}
          </span>
        )}
        {issue && stock.isSuccess && (
          <span className="text-muted-foreground">
            {adjustment
              ? t("vouchers.form.bookQuantity", {
                  quantity: quantityLabel(line.item.baseUnit, available ?? 0),
                })
              : available
                ? t("vouchers.form.available", {
                    quantity: quantityLabel(line.item.baseUnit, available),
                  })
                : t("vouchers.form.nothingAvailable")}
          </span>
        )}
        {gap !== null && (
          <span
            className={
              gap === 0
                ? "text-success-muted-foreground"
                : "font-medium text-warning-muted-foreground"
            }
          >
            {gap === 0
              ? t("vouchers.form.noGap")
              : t("vouchers.form.gap", {
                  quantity: `${gap > 0 ? "+" : "−"}${quantityLabel(line.item.baseUnit, Math.abs(gap))}`,
                })}
          </span>
        )}
      </div>
    </li>
  )
}

const ENTER = "Enter"

/** Champ seul, au même gabarit que les autres champs du formulaire. */
function InputGroupInputBox({ children }: { children: React.ReactNode }) {
  return <InputGroup>{children}</InputGroup>
}
