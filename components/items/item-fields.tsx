"use client"

import { HashIcon, TagIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Controller, type UseFormReturn } from "react-hook-form"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { baseUnits, type Warehouse } from "@/lib/api/stock"
import { cn } from "@/lib/utils"

import type { ItemFormValues } from "./item-form-schema"
import { PackagingsField } from "./packagings-field"
import { WarehouseChecklist } from "./warehouse-checklist"

type ItemFormProps = { form: UseFormReturn<ItemFormValues> }

/** Nom, référence et description. */
export function ItemIdentityFields({
  form,
  autoFocus,
}: ItemFormProps & { autoFocus?: boolean }) {
  const t = useTranslations()
  const errors = form.formState.errors
  const optional = (
    <span className="font-normal text-muted-foreground">
      ({t("common.optional")})
    </span>
  )
  return (
    <FieldGroup>
      <Field data-invalid={!!errors.name}>
        <FieldLabel htmlFor="name">{t("items.form.name")}</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="name"
            autoFocus={autoFocus}
            placeholder={t("items.form.namePlaceholder")}
            aria-invalid={!!errors.name}
            {...form.register("name")}
          />
          <InputGroupAddon>
            <TagIcon />
          </InputGroupAddon>
        </InputGroup>
        <FieldError errors={[errors.name]} />
      </Field>
      <Field data-invalid={!!errors.reference}>
        <FieldLabel htmlFor="reference">
          {t("items.form.reference")} {optional}
        </FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="reference"
            className="font-mono"
            placeholder={t("items.form.referencePlaceholder")}
            aria-invalid={!!errors.reference}
            {...form.register("reference")}
          />
          <InputGroupAddon>
            <HashIcon />
          </InputGroupAddon>
        </InputGroup>
        <FieldError errors={[errors.reference]} />
      </Field>
      <Field data-invalid={!!errors.description}>
        <FieldLabel htmlFor="description">
          {t("items.form.description")} {optional}
        </FieldLabel>
        <Textarea
          id="description"
          rows={2}
          placeholder={t("items.form.descriptionPlaceholder")}
          {...form.register("description")}
        />
        <FieldError errors={[errors.description]} />
      </Field>
    </FieldGroup>
  )
}

/** Unité de comptage (une carte par unité) et suivi par lot. */
export function ItemCountingFields({ form }: ItemFormProps) {
  const t = useTranslations()
  return (
    <>
      <Controller
        control={form.control}
        name="baseUnit"
        render={({ field }) => (
          <div
            role="radiogroup"
            aria-label={t("items.form.baseUnit")}
            className="grid grid-cols-2 gap-2 xl:grid-cols-3"
          >
            {baseUnits.map((unit) => {
              const selected = field.value === unit
              return (
                <button
                  key={unit}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => field.onChange(unit)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none",
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:border-foreground/20 hover:bg-muted/40"
                  )}
                >
                  <span className="block text-sm font-semibold">
                    {t(`units.${unit}.label`)}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t(`units.${unit}.hint`)}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      />
      <FieldError errors={[form.formState.errors.baseUnit]} />
      <Controller
        control={form.control}
        name="batchTracking"
        render={({ field }) => (
          <Field orientation="horizontal" className="mt-6">
            <FieldContent>
              <FieldLabel htmlFor="batchTracking">
                {t("items.form.batchTracking")}
              </FieldLabel>
              <FieldDescription>
                {t("items.form.batchTrackingHint")}
              </FieldDescription>
            </FieldContent>
            <Switch
              id="batchTracking"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </Field>
        )}
      />
    </>
  )
}

export function ItemPackagingsFields({ form }: ItemFormProps) {
  return (
    <PackagingsField
      control={form.control}
      register={form.register}
      errors={form.formState.errors.packagings}
    />
  )
}

export function ItemWarehousesField({
  form,
  warehouses,
}: ItemFormProps & { warehouses: Warehouse[] }) {
  return (
    <>
      <Controller
        control={form.control}
        name="warehouseIds"
        render={({ field }) => (
          <WarehouseChecklist
            warehouses={warehouses}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <FieldError errors={[form.formState.errors.warehouseIds]} />
    </>
  )
}
