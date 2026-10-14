"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { FormActions, FormSection } from "@/components/catalog/form-section"
import { usePageTour } from "@/components/tour/tour-provider"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ReadOnlyNotice } from "@/components/workspace/read-only-notice"
import type { Warehouse } from "@/lib/api/stock"
import { Routes } from "@/lib/routes"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"

import { useWarehouseForm } from "./use-warehouse-form"
import { WarehouseDetailsFields, WarehouseKindField } from "./warehouse-fields"

/** Fiche d'un dépôt : tout est modifiable sur un seul écran. */
export function WarehouseForm({
  warehouse,
  onConflict,
  readOnly = false,
}: {
  warehouse: Warehouse
  onConflict: () => void
  /** Consultation seule : le rôle Stock ne permet pas de modifier les dépôts. */
  readOnly?: boolean
}) {
  const t = useTranslations()
  const router = useRouter()
  const { form, submit, pending } = useWarehouseForm(warehouse, onConflict)
  usePageTour("warehouseForm")

  const onSubmit = form.handleSubmit(async (values) => {
    if (await submit(values)) toast.success(t("warehouses.saved"))
  })

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate>
      {readOnly && <ReadOnlyNotice />}
      <fieldset disabled={readOnly} className="contents">
        <FormSection
          title={t("warehouses.form.kind")}
          {...tourAnchor(TourAnchors.warehouseKind)}
        >
          <WarehouseKindField form={form} />
        </FormSection>
        <FormSection title={t("warehouses.form.details")}>
          <WarehouseDetailsFields form={form} />
        </FormSection>
      </fieldset>
      {!readOnly && (
        <FormActions>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => router.push(Routes.warehouses)}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" size="lg" disabled={pending}>
            {pending && <Spinner />}
            {t("common.save")}
          </Button>
        </FormActions>
      )}
    </form>
  )
}
