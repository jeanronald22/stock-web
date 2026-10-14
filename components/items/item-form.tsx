"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { FormActions, FormSection } from "@/components/catalog/form-section"
import { usePageTour } from "@/components/tour/tour-provider"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { Item, Warehouse } from "@/lib/api/stock"
import { Routes } from "@/lib/routes"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"

import {
  ItemCountingFields,
  ItemIdentityFields,
  ItemPackagingsFields,
  ItemWarehousesField,
} from "./item-fields"
import { ItemPhotoField } from "./item-photo"
import { useItemForm } from "./use-item-form"

/** Fiche d'un article : tout est modifiable sur un seul écran. */
export function ItemForm({
  item,
  warehouses,
  onConflict,
}: {
  item: Item
  warehouses: Warehouse[]
  onConflict: () => void
}) {
  const t = useTranslations()
  const router = useRouter()
  const { form, submit, pending } = useItemForm(item, [], onConflict)
  usePageTour("itemForm")

  const onSubmit = form.handleSubmit(async (values) => {
    if (await submit(values)) toast.success(t("items.saved"))
  })

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate>
      <FormSection
        title={t("items.form.photo")}
        description={t("items.form.photoHint")}
      >
        <ItemPhotoField item={item} />
      </FormSection>
      <FormSection title={t("items.form.identity")}>
        <ItemIdentityFields form={form} />
      </FormSection>
      <FormSection
        title={t("items.form.counting")}
        {...tourAnchor(TourAnchors.itemBaseUnit)}
      >
        <ItemCountingFields form={form} />
      </FormSection>
      <FormSection
        title={t("items.form.packagings")}
        description={t("items.form.packagingsHint")}
        {...tourAnchor(TourAnchors.itemPackagings)}
      >
        <ItemPackagingsFields form={form} />
      </FormSection>
      <FormSection
        title={t("items.form.warehouses")}
        description={t("items.form.warehousesHint")}
        {...tourAnchor(TourAnchors.itemWarehouses)}
      >
        <ItemWarehousesField form={form} warehouses={warehouses} />
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
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Spinner />}
          {t("common.save")}
        </Button>
      </FormActions>
    </form>
  )
}
