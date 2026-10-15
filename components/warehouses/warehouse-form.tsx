"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { FormActions, FormSection } from "@/components/catalog/form-section"
import { usePageTour } from "@/components/tour/tour-provider"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { Warehouse } from "@/lib/api/stock"
import { RecordRoutes } from "@/lib/routes"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"

import { useWarehouseForm } from "./use-warehouse-form"
import { WarehouseDetailsFields, WarehouseKindField } from "./warehouse-fields"

/** Modification d'un dépôt, puis retour à sa fiche. */
export function WarehouseForm({
  warehouse,
  onConflict,
}: {
  warehouse: Warehouse
  onConflict: () => void
}) {
  const t = useTranslations()
  const router = useRouter()
  const { form, submit, pending } = useWarehouseForm(warehouse, onConflict)
  usePageTour("warehouseForm")

  const onSubmit = form.handleSubmit(async (values) => {
    if (!(await submit(values))) return
    toast.success(t("warehouses.saved"))
    router.push(RecordRoutes.warehouse(warehouse.id))
  })

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate>
      <fieldset className="contents">
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
      <FormActions>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => router.push(RecordRoutes.warehouse(warehouse.id))}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Spinner />}
          {t("common.save")}
        </Button>
      </FormActions>
    </form>
  )
}
