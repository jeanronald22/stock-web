"use client"

import { XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  Controller,
  useFieldArray,
  useWatch,
  type UseFormReturn,
} from "react-hook-form"

import { useQuantityLabel } from "@/components/items/describe"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
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
import { VoucherType } from "@/lib/api/vouchers"
import { useItemStock } from "@/lib/api/voucher-queries"
import { parseQuantity } from "@/lib/forms/quantity"

import { ItemPicker } from "./item-picker"
import {
  BASE_UNIT_CHOICE,
  baseQuantity,
  newLine,
  type VoucherFormValues,
} from "./voucher-form-schema"

type FieldProps = { form: UseFormReturn<VoucherFormValues>; type: VoucherType }

/** Articles du bon : recherche, puis une ligne par article (quantité, unité, lot). */
export function VoucherLinesField({ form, type }: FieldProps) {
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

  return (
    <div className="space-y-4">
      <ItemPicker
        warehouseId={type === VoucherType.issue ? warehouseId : undefined}
        excludedIds={excluded}
        onPick={(item) => append(newLine(item))}
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
  onRemove,
}: FieldProps & { index: number; onRemove: () => void }) {
  const t = useTranslations()
  const quantityLabel = useQuantityLabel()
  const line = useWatch({ control: form.control, name: `lines.${index}` })
  const warehouseId = useWatch({ control: form.control, name: "warehouseId" })
  const errors = form.formState.errors.lines?.[index]
  const issue = type === VoucherType.issue
  const stock = useItemStock(issue ? line.itemId : undefined)
  const inWarehouse = stock.data?.warehouses.find(
    (entry) => entry.warehouse.id === warehouseId
  )

  const entered = parseQuantity(line.quantity)
  const converted =
    entered !== null && entered > 0 && line.unit !== BASE_UNIT_CHOICE
      ? baseQuantity(line.item, entered, line.unit)
      : null
  const unitItems = [
    { value: BASE_UNIT_CHOICE, label: t(`units.${line.item.baseUnit}.label`) },
    ...line.item.packagings.map((packaging) => ({
      value: packaging.name,
      label: `${packaging.name} (${quantityLabel(line.item.baseUnit, packaging.quantity)})`,
    })),
  ]
  const batchItems = (inWarehouse?.batches ?? []).map((batch) => ({
    value: batch.batch ?? "",
    label: `${batch.batch} · ${quantityLabel(line.item.baseUnit, batch.quantity)}`,
  }))
  const available = line.item.batchTracking
    ? inWarehouse?.batches.find((batch) => batch.batch === line.batch)?.quantity
    : inWarehouse?.quantity

  return (
    <li className="animate-rise-in rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 font-semibold">{line.item.name}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("vouchers.form.remove")}
          onClick={onRemove}
        >
          <XIcon />
        </Button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>{t("vouchers.form.quantity")}</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              inputMode="decimal"
              aria-label={`${t("vouchers.form.quantity")} · ${line.item.name}`}
              aria-invalid={!!errors?.quantity}
              {...form.register(`lines.${index}.quantity`)}
            />
          </InputGroup>
          <FieldError errors={[errors?.quantity]} />
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
      </div>

      {line.item.batchTracking && (
        <div className="mt-3">
          {issue ? (
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
                    <SelectValue placeholder={t("vouchers.form.chooseBatch")} />
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
          ) : (
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>{t("vouchers.form.batch")}</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                aria-label={`${t("vouchers.form.batch")} · ${line.item.name}`}
                placeholder={t("vouchers.form.batchPlaceholder")}
                aria-invalid={!!errors?.batch}
                {...form.register(`lines.${index}.batch`)}
              />
            </InputGroup>
          )}
          <FieldError errors={[errors?.batch]} />
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
        {converted !== null && (
          <span>
            {t("vouchers.form.converted", {
              quantity: quantityLabel(line.item.baseUnit, converted),
            })}
          </span>
        )}
        {issue && stock.isSuccess && (
          <span>
            {available
              ? t("vouchers.form.available", {
                  quantity: quantityLabel(line.item.baseUnit, available),
                })
              : t("vouchers.form.nothingAvailable")}
          </span>
        )}
      </div>
    </li>
  )
}
