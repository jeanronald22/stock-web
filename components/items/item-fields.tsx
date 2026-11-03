"use client"

import {
  HashIcon,
  ScanBarcodeIcon,
  TagIcon,
  TriangleAlertIcon,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Controller, useWatch, type UseFormReturn } from "react-hook-form"

import { useCategoryTree } from "@/components/categories/use-category-tree"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { BarcodeScanner } from "@/components/scan/barcode-scanner"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { baseUnits, type ExistingItem, type Warehouse } from "@/lib/api/stock"
import { RecordRoutes } from "@/lib/routes"
import { cn } from "@/lib/utils"

import type { ItemFormValues } from "./item-form-schema"
import { PackagingsField } from "./packagings-field"
import { WarehouseChecklist } from "./warehouse-checklist"

type ItemFormProps = { form: UseFormReturn<ItemFormValues> }

/** Valeur « Sans catégorie » : aucun identifiant ne peut la prendre. */
const NO_CATEGORY = "none"

/** Nom, référence (lecture seule), catégorie et description. */
export function ItemIdentityFields({
  form,
  reference,
  autoFocus,
  sameNameItem,
}: ItemFormProps & {
  /** Celle de l'article modifié ; absente à la création. */
  reference?: string
  autoFocus?: boolean
  /** Création : article actif qui porte déjà ce nom (D50). */
  sameNameItem?: ExistingItem | null
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
        {sameNameItem && (
          <p
            role="status"
            className="flex gap-2 rounded-xl bg-warning-muted/60 p-3 text-sm text-warning-muted-foreground"
          >
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {t("items.form.sameName")}{" "}
              <Link
                href={RecordRoutes.item(sameNameItem.id)}
                target="_blank"
                className="font-medium underline underline-offset-4"
              >
                {sameNameItem.reference
                  ? `${sameNameItem.reference} · ${sameNameItem.name}`
                  : sameNameItem.name}
              </Link>
              {". "}
              {t("items.form.sameNameHint")}
            </span>
          </p>
        )}
      </Field>
      {/* Attribuée par l'API à la création, dans l'ordre (D41) : on la montre, sans la saisir. */}
      <Field>
        <FieldLabel htmlFor="reference">{t("items.form.reference")}</FieldLabel>
        <InputGroup className="bg-muted/40">
          <InputGroupInput
            id="reference"
            className={cn(reference ? "font-mono" : "text-muted-foreground")}
            readOnly
            value={reference ?? t("items.form.referenceAuto")}
            aria-describedby="reference-hint"
          />
          <InputGroupAddon>
            <HashIcon />
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription id="reference-hint">
          {t("items.form.referenceHint")}
        </FieldDescription>
      </Field>
      <ItemBarcodeField form={form} />
      <ItemCategoryField form={form} />
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

/** Code-barres (D34) : tapé, ou lu par la caméra ; une douchette le tape d'elle-même. */
function ItemBarcodeField({ form }: ItemFormProps) {
  const t = useTranslations()
  const [scanning, setScanning] = useState(false)
  const error = form.formState.errors.barcode
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor="barcode">
        {t("items.form.barcode")}{" "}
        <span className="font-normal text-muted-foreground">
          ({t("common.optional")})
        </span>
      </FieldLabel>
      <InputGroup>
        <InputGroupInput
          id="barcode"
          className="font-mono"
          inputMode="numeric"
          autoComplete="off"
          placeholder={t("items.form.barcodePlaceholder")}
          aria-invalid={!!error}
          {...form.register("barcode")}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={t("items.form.barcodeScan")}
            onClick={() => setScanning(true)}
          >
            <ScanBarcodeIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldError errors={[error]} />
      <BarcodeScanner
        open={scanning}
        onOpenChange={setScanning}
        title={t("items.form.barcodeScan")}
        onDetected={(code) =>
          form.setValue("barcode", code, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      />
    </Field>
  )
}

/** Catégorie de l'article ; les catégories se créent depuis la liste des articles. */
function ItemCategoryField({ form }: ItemFormProps) {
  const t = useTranslations()
  const { nodes } = useCategoryTree()
  const error = form.formState.errors.categoryId
  const items = [
    { value: NO_CATEGORY, label: t("items.form.noCategory") },
    ...nodes.map((node) => ({ value: node.category.id, label: node.path })),
  ]
  return (
    <Controller
      control={form.control}
      name="categoryId"
      render={({ field }) => (
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="categoryId">
            {t("items.form.category")}{" "}
            <span className="font-normal text-muted-foreground">
              ({t("common.optional")})
            </span>
          </FieldLabel>
          <Select
            items={items}
            value={field.value ?? NO_CATEGORY}
            onValueChange={(next) =>
              field.onChange(!next || next === NO_CATEGORY ? null : next)
            }
          >
            <SelectTrigger
              id="categoryId"
              className="w-full"
              aria-invalid={!!error}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CATEGORY}>
                {t("items.form.noCategory")}
              </SelectItem>
              {nodes.map((node) => (
                <SelectItem key={node.category.id} value={node.category.id}>
                  <span
                    style={{ paddingInlineStart: `${node.depth * 0.875}rem` }}
                  >
                    {node.category.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {nodes.length === 0 && (
            <FieldDescription>{t("items.form.categoryHint")}</FieldDescription>
          )}
          <FieldError errors={[error]} />
        </Field>
      )}
    />
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
      setValue={form.setValue}
      errors={form.formState.errors.packagings}
    />
  )
}

export function ItemWarehousesField({
  form,
  warehouses,
}: ItemFormProps & { warehouses: Warehouse[] }) {
  const t = useTranslations("units")
  const baseUnit = useWatch({ control: form.control, name: "baseUnit" })
  const errors = form.formState.errors.warehouses
  return (
    <>
      <Controller
        control={form.control}
        name="warehouses"
        render={({ field }) => (
          <WarehouseChecklist
            warehouses={warehouses}
            value={field.value}
            onChange={field.onChange}
            unitLabel={t(`${baseUnit}.short`)}
            errors={Array.isArray(errors) ? errors : undefined}
          />
        )}
      />
      {/* Erreur de la liste elle-même (dépôt devenu indisponible), pas d'un seuil. */}
      <FieldError
        errors={[errors?.root ?? (Array.isArray(errors) ? undefined : errors)]}
      />
    </>
  )
}
