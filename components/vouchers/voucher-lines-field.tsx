"use client"

import { TriangleAlertIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import {
  Controller,
  useFieldArray,
  useWatch,
  type UseFormReturn,
} from "react-hook-form"

import { useBatchLabel, useQuantityLabel } from "@/components/items/describe"
import { ItemThumb } from "@/components/items/item-thumb"
import { LocationLabel } from "@/components/locations/location-label"
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
import {
  incomingTypes,
  VoucherLimits,
  VoucherType,
  type EntryType,
} from "@/lib/api/vouchers"
import { useItemStock, useItemStocks } from "@/lib/api/voucher-queries"
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
/** [fromOrigin] : retour depuis un bon ; ses lignes sont proposées, aucun autre article n'entre. */
export function VoucherLinesField({
  form,
  type,
  searchRef,
  supplier,
  fromOrigin = false,
}: FieldProps &
  LineNavigation & {
    supplier?: { id: string; name: string } | null
    fromOrigin?: boolean
  }) {
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
      {!fromOrigin && (
        <ItemPicker
          inputRef={searchRef}
          autoFocus
          supplier={supplier}
          warehouseId={incomingTypes.has(type) ? undefined : warehouseId}
          excludedIds={excluded}
          onPick={(item) =>
            append(newLine(item, type), {
              focusName: `lines.${fields.length}.quantity`,
            })
          }
          onScan={(item) => {
            // Scanné une nouvelle fois : une unité de plus sur sa ligne (sans lot, il n'y en a qu'une).
            const index = form
              .getValues("lines")
              .findIndex(
                (line) => line.itemId === item.id && !line.item.batchTracking
              )
            if (index < 0)
              return append(
                { ...newLine(item, type), quantity: "1" },
                { focusName: `lines.${fields.length}.quantity` }
              )
            const current =
              parseQuantity(form.getValues(`lines.${index}.quantity`)) ?? 0
            form.setValue(`lines.${index}.quantity`, String(current + 1), {
              shouldValidate: true,
            })
            form.setFocus(`lines.${index}.quantity`)
          }}
        />
      )}
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
      {!incomingTypes.has(type) && <MixedBatchesWarning lines={lines ?? []} />}
      {rootError && "message" in rootError && (
        <FieldError errors={[rootError as { message?: string }]} />
      )}
    </div>
  )
}

/**
 * Deux nuances ou deux calibres d'un même article sur un bon qui sort (D35) : le client risque de le
 * voir à la pose. Signalé, pas interdit (un lot peut manquer).
 */
function MixedBatchesWarning({ lines }: { lines: VoucherFormValues["lines"] }) {
  const t = useTranslations("vouchers.form")
  const tracked = lines.filter((line) => line.item.batchTracking && line.batch)
  const itemIds = [...new Set(tracked.map((line) => line.itemId))]
  const stocks = useItemStocks(itemIds)
  const mixed = itemIds.flatMap((itemId, position) => {
    const batches = (stocks[position]?.data?.warehouses ?? []).flatMap(
      (entry) => entry.batches
    )
    const chosen = tracked
      .filter((line) => line.itemId === itemId)
      .map((line) => batches.find((batch) => batch.batch === line.batch))
    const distinct = (values: (string | null | undefined)[]) =>
      new Set(values.filter(Boolean).map((value) => value!.toLowerCase())).size
    const shades = distinct(chosen.map((batch) => batch?.shade))
    const calibers = distinct(chosen.map((batch) => batch?.caliber))
    if (shades < 2 && calibers < 2) return []
    const name = tracked.find((line) => line.itemId === itemId)!.item.name
    return [{ itemId, name, shades, calibers }]
  })
  if (mixed.length === 0) return null
  return (
    <div
      role="status"
      className="flex gap-2 rounded-xl border border-warning/40 bg-warning-muted/60 p-3 text-sm text-warning-muted-foreground"
    >
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        <ul className="space-y-1 font-medium">
          {mixed.flatMap((entry) => [
            ...(entry.shades > 1
              ? [
                  <li key={`${entry.itemId}-shade`}>
                    {t("mixedShades", {
                      name: entry.name,
                      count: entry.shades,
                    })}
                  </li>,
                ]
              : []),
            ...(entry.calibers > 1
              ? [
                  <li key={`${entry.itemId}-caliber`}>
                    {t("mixedCalibers", {
                      name: entry.name,
                      count: entry.calibers,
                    })}
                  </li>,
                ]
              : []),
          ])}
        </ul>
        <p className="mt-1">{t("mixedConsequence")}</p>
      </div>
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
  const batchLabel = useBatchLabel()
  const line = useWatch({ control: form.control, name: `lines.${index}` })
  const warehouseId = useWatch({ control: form.control, name: "warehouseId" })
  const errors = form.formState.errors.lines?.[index]
  // Le stock part du dépôt (sortie, transfert, casse) ou y est compté : le disponible s'affiche.
  const issue = !incomingTypes.has(type)
  // Réception par lot : le stock dit ce qu'on sait déjà des lots de l'article (nuance, calibre).
  const stock = useItemStock(
    issue || line.item.batchTracking ? line.itemId : undefined
  )
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
    label: `${batchLabel(batch.batch ?? "", batch)} · ${quantityLabel(line.item.baseUnit, batch.quantity)}`,
  }))
  // Réception d'un lot déjà connu, dans n'importe quel dépôt : ses caractéristiques s'affichent.
  const knownBatch =
    type === VoucherType.receipt && line.batch.trim()
      ? stock.data?.warehouses
          .flatMap((entry) => entry.batches)
          .find(
            (batch) =>
              batch.batch?.toLowerCase() === line.batch.trim().toLowerCase() &&
              (batch.shade || batch.caliber)
          )
      : undefined
  const traitsInput =
    type === VoucherType.receipt && line.item.batchTracking && !knownBatch
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
  // Retour depuis un bon : le lot est celui du bon d'origine.
  const fixedBatch = line.limit !== null
  const batchInput = line.item.batchTracking && !issue && !fixedBatch

  return (
    <li className="animate-rise-in rounded-xl border p-3">
      {/* Téléphone : l'article sur une ligne, puis la quantité et son unité côte à côte. */}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-2 md:grid-cols-[minmax(0,1.2fr)_6.5rem_minmax(11rem,1.2fr)_minmax(0,1fr)_auto] md:items-start">
        <div className="col-span-2 flex min-h-11 items-center justify-between gap-2 md:col-span-1 md:pr-2">
          <span className="flex min-w-0 items-center gap-3">
            <ItemThumb imageUrl={line.item.imageUrl} size="sm" />
            <span className="min-w-0">
              <span className="block truncate font-semibold">
                {line.item.name}
              </span>
              {line.item.locations[warehouseId] && (
                <LocationLabel
                  location={line.item.locations[warehouseId]}
                  className="text-xs"
                />
              )}
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
        <div className="col-span-2 empty:hidden md:col-span-1 md:empty:block">
          {line.item.batchTracking &&
            (fixedBatch ? (
              <div className="flex h-11 items-center rounded-lg border bg-muted/40 px-3.5 text-muted-foreground">
                {t("vouchers.form.batch")} {line.batch}
              </div>
            ) : batchInput ? (
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
      {traitsInput && (
        <div className="mt-2 grid grid-cols-2 gap-2 md:max-w-sm">
          {(["shade", "caliber"] as const).map((trait) => (
            <InputGroupInputBox key={trait}>
              <InputGroupInput
                placeholder={t(`vouchers.form.${trait}`)}
                aria-label={`${t(`vouchers.form.${trait}`)} · ${line.item.name}`}
                maxLength={VoucherLimits.batchTrait}
                {...form.register(`lines.${index}.${trait}`)}
              />
            </InputGroupInputBox>
          ))}
        </div>
      )}
      {knownBatch && (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("vouchers.form.knownBatch", {
            batch: batchLabel(knownBatch.batch ?? "", knownBatch),
          })}
        </p>
      )}
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
        {line.limit !== null && (
          <span className="text-muted-foreground">
            {t("vouchers.returns.remaining", {
              quantity: quantityLabel(line.item.baseUnit, line.limit),
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
