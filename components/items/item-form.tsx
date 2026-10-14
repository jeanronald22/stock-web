"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { HashIcon, TagIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { FormActions, FormSection } from "@/components/catalog/form-section"
import { usePageTour } from "@/components/tour/tour-provider"
import { Button } from "@/components/ui/button"
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
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { isProblem, ProblemCode } from "@/lib/api/problem"
import { baseUnits, type Item, type Warehouse } from "@/lib/api/stock"
import { useSaveItem } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { applyServerErrors } from "@/lib/forms/apply-server-errors"
import { applyProblemToField } from "@/lib/forms/problem-fields"
import { ListQueryParams, Routes } from "@/lib/routes"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"
import { cn } from "@/lib/utils"

import {
  itemFormDefaults,
  itemFormSchema,
  toItemInput,
  type ItemFormValues,
} from "./item-form-schema"
import { PackagingsField } from "./packagings-field"
import { WarehouseChecklist } from "./warehouse-checklist"

const FIELDS = [
  "name",
  "reference",
  "description",
  "baseUnit",
  "batchTracking",
  "packagings",
  "warehouseIds",
] as const

/**
 * Création si [item] est absent, sinon modification. Un nouvel article est proposé d'office dans
 * le dépôt filtré de la liste d'où l'on vient, ou dans l'unique dépôt de l'entreprise.
 */
export function ItemForm({
  item,
  warehouses,
  onConflict,
}: {
  item?: Item
  warehouses: Warehouse[]
  onConflict?: () => void
}) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorMessage = useErrorMessage()
  const save = useSaveItem()
  // Créé une seule fois : un nouvel envoi après une coupure réseau ne crée pas de doublon.
  const [id] = useState(() => item?.id ?? crypto.randomUUID())
  usePageTour("itemForm")

  const fromList = searchParams.get(ListQueryParams.warehouse)
  const defaultWarehouseIds = fromList
    ? [fromList]
    : warehouses.length === 1
      ? [warehouses[0].id]
      : []

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(
      itemFormSchema({
        required: t("validation.required"),
        tooLong: (max) => t("validation.tooLong", { max }),
        invalidNumber: t("validation.invalidNumber"),
        positive: t("validation.positive"),
        wholeNumber: t("validation.wholeNumber"),
        duplicateName: t("validation.duplicateName"),
      })
    ),
    defaultValues: itemFormDefaults(item, defaultWarehouseIds, locale),
  })
  const errors = form.formState.errors

  const submit = form.handleSubmit((values) =>
    save.mutate(
      { id, version: item?.version, input: toItemInput(values) },
      {
        onSuccess: () => {
          if (item) {
            toast.success(t("items.saved"))
          } else {
            toast.success(t("items.created"))
            router.replace(Routes.items)
          }
        },
        onError: (error) => {
          if (applyServerErrors(error, FIELDS, form.setError)) return
          const placed = applyProblemToField<ItemFormValues>(
            error,
            {
              [ProblemCode.itemReferenceTaken]: "reference",
              [ProblemCode.warehouseUnavailable]: "warehouseIds",
            },
            form.setError
          )
          if (placed) return
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

  const optional = (
    <span className="font-normal text-muted-foreground">
      ({t("common.optional")})
    </span>
  )

  return (
    <form onSubmit={submit} noValidate>
      <FormSection title={t("items.form.identity")}>
        <FieldGroup>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">{t("items.form.name")}</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="name"
                autoFocus={!item}
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
      </FormSection>

      <FormSection
        title={t("items.form.counting")}
        {...tourAnchor(TourAnchors.itemBaseUnit)}
      >
        <Controller
          control={form.control}
          name="baseUnit"
          render={({ field }) => (
            <div
              role="radiogroup"
              aria-label={t("items.form.baseUnit")}
              className="grid grid-cols-2 gap-2 lg:grid-cols-3"
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
      </FormSection>

      <FormSection
        title={t("items.form.packagings")}
        description={t("items.form.packagingsHint")}
        {...tourAnchor(TourAnchors.itemPackagings)}
      >
        <PackagingsField
          control={form.control}
          register={form.register}
          errors={errors.packagings}
        />
      </FormSection>

      <FormSection
        title={t("items.form.warehouses")}
        description={t("items.form.warehousesHint")}
        {...tourAnchor(TourAnchors.itemWarehouses)}
      >
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
        <FieldError errors={[errors.warehouseIds]} />
      </FormSection>

      <FormActions>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => router.push(Routes.items)}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" size="lg" disabled={save.isPending}>
          {save.isPending && <Spinner />}
          {item ? t("common.save") : t("items.form.create")}
        </Button>
      </FormActions>
    </form>
  )
}
