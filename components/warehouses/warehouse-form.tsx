"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { MapPinIcon, NavigationIcon, WarehouseIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { FormActions, FormSection } from "@/components/catalog/form-section"
import { usePageTour } from "@/components/tour/tour-provider"
import { Button } from "@/components/ui/button"
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
import { Spinner } from "@/components/ui/spinner"
import { isProblem, ProblemCode } from "@/lib/api/problem"
import { StockLimits, warehouseKinds, type Warehouse } from "@/lib/api/stock"
import { useSaveWarehouse } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { applyProblemToField } from "@/lib/forms/problem-fields"
import { applyServerErrors } from "@/lib/forms/apply-server-errors"
import { citySuggestions, defaultCountry } from "@/lib/onboarding/catalog"
import { Routes } from "@/lib/routes"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"
import { cn } from "@/lib/utils"

import { warehouseKindIcons } from "./warehouse-kind"

const CITY_LIST_ID = "warehouse-city-suggestions"
const FIELDS = ["name", "kind", "city", "address"] as const

/** Création si [warehouse] est absent, sinon modification de la fiche ouverte. */
export function WarehouseForm({
  warehouse,
  onConflict,
}: {
  warehouse?: Warehouse
  onConflict?: () => void
}) {
  const t = useTranslations()
  const router = useRouter()
  const errorMessage = useErrorMessage()
  const save = useSaveWarehouse()
  // Créé une seule fois : un nouvel envoi après une coupure réseau ne crée pas de doublon.
  const [id] = useState(() => warehouse?.id ?? crypto.randomUUID())
  usePageTour("warehouseForm")

  const text = (max: number) =>
    z.string().trim().max(max, t("validation.tooLong", { max }))
  const form = useForm({
    resolver: zodResolver(
      z.object({
        name: text(StockLimits.name).min(1, t("validation.required")),
        kind: z.enum(warehouseKinds),
        city: text(StockLimits.city),
        address: text(StockLimits.address),
      })
    ),
    defaultValues: {
      name: warehouse?.name ?? "",
      kind: warehouse?.kind ?? "WAREHOUSE",
      city: warehouse?.city ?? "",
      address: warehouse?.address ?? "",
    },
  })

  const submit = form.handleSubmit((input) =>
    save.mutate(
      { id, version: warehouse?.version, input },
      {
        onSuccess: () => {
          if (warehouse) {
            toast.success(t("warehouses.saved"))
          } else {
            toast.success(t("warehouses.created"))
            router.replace(Routes.warehouses)
          }
        },
        onError: (error) => {
          if (applyServerErrors(error, FIELDS, form.setError)) return
          if (
            applyProblemToField(
              error,
              { [ProblemCode.warehouseNameTaken]: "name" },
              form.setError
            )
          )
            return
          toast.error(errorMessage(error), {
            action:
              onConflict && isProblem(error, ProblemCode.editConflict)
                ? { label: t("common.reload"), onClick: onConflict }
                : undefined,
          })
        },
      }
    )
  )

  return (
    <form onSubmit={submit} noValidate>
      <FormSection
        title={t("warehouses.form.kind")}
        {...tourAnchor(TourAnchors.warehouseKind)}
      >
        <Controller
          control={form.control}
          name="kind"
          render={({ field }) => (
            <div
              role="radiogroup"
              aria-label={t("warehouses.form.kind")}
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
                      "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none",
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:border-foreground/20 hover:bg-muted/40"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-6",
                        selected ? "text-primary" : "text-muted-foreground"
                      )}
                      aria-hidden
                    />
                    <span>
                      <span className="block font-semibold">
                        {t(`warehouses.kinds.${kind}.label`)}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {t(`warehouses.kinds.${kind}.hint`)}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        />
      </FormSection>

      <FormSection title={t("warehouses.form.details")}>
        <FieldGroup>
          <Field data-invalid={!!form.formState.errors.name}>
            <FieldLabel htmlFor="name">{t("warehouses.form.name")}</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="name"
                autoFocus={!warehouse}
                placeholder={t("warehouses.form.namePlaceholder")}
                aria-invalid={!!form.formState.errors.name}
                {...form.register("name")}
              />
              <InputGroupAddon>
                <WarehouseIcon />
              </InputGroupAddon>
            </InputGroup>
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
            <Field data-invalid={!!form.formState.errors.city}>
              <FieldLabel htmlFor="city">
                {t("warehouses.form.city")}{" "}
                <span className="font-normal text-muted-foreground">
                  ({t("common.optional")})
                </span>
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
              <FieldError errors={[form.formState.errors.city]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.address}>
              <FieldLabel htmlFor="address">
                {t("warehouses.form.address")}{" "}
                <span className="font-normal text-muted-foreground">
                  ({t("common.optional")})
                </span>
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
              <FieldError errors={[form.formState.errors.address]} />
            </Field>
          </div>
        </FieldGroup>
      </FormSection>

      <FormActions>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => router.push(Routes.warehouses)}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" size="lg" disabled={save.isPending}>
          {save.isPending && <Spinner />}
          {warehouse ? t("common.save") : t("warehouses.form.create")}
        </Button>
      </FormActions>
    </form>
  )
}
