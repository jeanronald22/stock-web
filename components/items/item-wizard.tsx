"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Splash } from "@/components/app/splash"
import { CatalogScene } from "@/components/illustrations/catalog-scene"
import { DepotsScene } from "@/components/illustrations/depots-scene"
import { MeasureScene } from "@/components/illustrations/measure-scene"
import { PackagingScene } from "@/components/illustrations/packaging-scene"
import { FormWizard, type WizardStep } from "@/components/wizard/form-wizard"
import type { Warehouse } from "@/lib/api/stock"
import { useWarehouses } from "@/lib/api/stock-queries"
import { ListQueryParams, Routes } from "@/lib/routes"

import {
  ItemCountingFields,
  ItemIdentityFields,
  ItemPackagingsFields,
  ItemWarehousesField,
} from "./item-fields"
import type { ItemFormValues } from "./item-form-schema"
import { useItemForm } from "./use-item-form"

export function ItemWizard() {
  const t = useTranslations("common")
  const warehouses = useWarehouses()
  if (!warehouses.data) return <Splash label={t("loading")} />
  return <ItemWizardSteps warehouses={warehouses.data} />
}

/**
 * Création d'un article en quatre questions : quoi, compté comment, conditionné comment, où.
 * Il est proposé d'office dans le dépôt filtré de la liste d'où l'on vient, ou dans l'unique dépôt.
 */
function ItemWizardSteps({ warehouses }: { warehouses: Warehouse[] }) {
  const t = useTranslations()
  const router = useRouter()
  const fromList = useSearchParams().get(ListQueryParams.warehouse)
  const defaultWarehouseIds = fromList
    ? [fromList]
    : warehouses.length === 1
      ? [warehouses[0].id]
      : []
  const { form, submit, pending } = useItemForm(undefined, defaultWarehouseIds)

  const steps: WizardStep<ItemFormValues>[] = [
    {
      key: "identity",
      illustration: <CatalogScene />,
      title: t("items.wizard.identity.title"),
      description: t("items.wizard.identity.description"),
      fields: ["name", "reference", "description"],
      content: <ItemIdentityFields form={form} autoFocus />,
    },
    {
      key: "counting",
      illustration: <MeasureScene />,
      title: t("items.wizard.counting.title"),
      description: t("items.wizard.counting.description"),
      fields: ["baseUnit", "batchTracking"],
      content: <ItemCountingFields form={form} />,
    },
    {
      key: "packagings",
      illustration: <PackagingScene />,
      title: t("items.wizard.packagings.title"),
      description: t("items.wizard.packagings.description"),
      fields: ["packagings"],
      content: <ItemPackagingsFields form={form} />,
    },
    {
      key: "warehouses",
      illustration: <DepotsScene />,
      title: t("items.wizard.warehouses.title"),
      description: t("items.wizard.warehouses.description"),
      fields: ["warehouseIds"],
      content: <ItemWarehousesField form={form} warehouses={warehouses} />,
    },
  ]

  return (
    <FormWizard
      form={form}
      steps={steps}
      eyebrow={t("items.wizard.eyebrow")}
      nextLabel={t("common.continue")}
      submitLabel={t("items.form.create")}
      submitting={pending}
      exitLabel={t("common.cancel")}
      onExit={() => router.push(Routes.items)}
      onSubmit={async (values) => {
        const saved = await submit(values)
        if (saved) {
          toast.success(t("items.created"))
          router.replace(Routes.items)
        }
        return saved
      }}
    />
  )
}
