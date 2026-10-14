"use client"

import { MapPinIcon, NavigationIcon, WarehouseIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Controller, type UseFormReturn } from "react-hook-form"

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { warehouseKinds } from "@/lib/api/stock"
import { citySuggestions, defaultCountry } from "@/lib/onboarding/catalog"
import { cn } from "@/lib/utils"

import type { WarehouseFormValues } from "./use-warehouse-form"
import { warehouseKindIcons } from "./warehouse-kind"

const CITY_LIST_ID = "warehouse-city-suggestions"

/** Type de lieu : trois grandes cartes, une seule choisie. */
export function WarehouseKindField({
  form,
}: {
  form: UseFormReturn<WarehouseFormValues>
}) {
  const t = useTranslations("warehouses")
  return (
    <Controller
      control={form.control}
      name="kind"
      render={({ field }) => (
        <div
          role="radiogroup"
          aria-label={t("form.kind")}
          className="grid gap-3 sm:grid-cols-3"
        >
          {warehouseKinds.map((kind) => {
            const Icon = warehouseKindIcons[kind]
            const selected = field.value === kind
            return (
              <button
                key={kind}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => field.onChange(kind)}
                className={cn(
                  "flex items-center gap-4 rounded-xl border p-4 text-left transition-all focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none sm:flex-col sm:items-start sm:gap-3",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-foreground/20 hover:bg-muted/40"
                )}
              >
                <Icon
                  className={cn(
                    "size-7 shrink-0",
                    selected ? "text-primary" : "text-muted-foreground"
                  )}
                  aria-hidden
                />
                <span>
                  <span className="block font-semibold">
                    {t(`kinds.${kind}.label`)}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {t(`kinds.${kind}.hint`)}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    />
  )
}

/** Nom, ville et repère du dépôt. */
export function WarehouseDetailsFields({
  form,
  autoFocus,
}: {
  form: UseFormReturn<WarehouseFormValues>
  autoFocus?: boolean
}) {
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
        <FieldLabel htmlFor="name">{t("warehouses.form.name")}</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="name"
            autoFocus={autoFocus}
            placeholder={t("warehouses.form.namePlaceholder")}
            aria-invalid={!!errors.name}
            {...form.register("name")}
          />
          <InputGroupAddon>
            <WarehouseIcon />
          </InputGroupAddon>
        </InputGroup>
        <FieldError errors={[errors.name]} />
      </Field>
      <Field data-invalid={!!errors.city}>
        <FieldLabel htmlFor="city">
          {t("warehouses.form.city")} {optional}
        </FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="city"
            list={CITY_LIST_ID}
            autoComplete="address-level2"
            placeholder={t("warehouses.form.cityPlaceholder")}
            {...form.register("city")}
          />
          <InputGroupAddon>
            <MapPinIcon />
          </InputGroupAddon>
        </InputGroup>
        <datalist id={CITY_LIST_ID}>
          {citySuggestions[defaultCountry].map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
        <FieldError errors={[errors.city]} />
      </Field>
      <Field data-invalid={!!errors.address}>
        <FieldLabel htmlFor="address">
          {t("warehouses.form.address")} {optional}
        </FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="address"
            placeholder={t("warehouses.form.addressPlaceholder")}
            {...form.register("address")}
          />
          <InputGroupAddon>
            <NavigationIcon />
          </InputGroupAddon>
        </InputGroup>
        <FieldError errors={[errors.address]} />
      </Field>
    </FieldGroup>
  )
}
