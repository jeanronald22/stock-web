"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { DepotScene } from "@/components/illustrations/depot-scene"
import { LocationScene } from "@/components/illustrations/location-scene"
import { FormWizard, type WizardStep } from "@/components/wizard/form-wizard"
import { Routes } from "@/lib/routes"

import {
  useWarehouseForm,
  type WarehouseFormValues,
} from "./use-warehouse-form"
import { WarehouseDetailsFields, WarehouseKindField } from "./warehouse-fields"

/** Création d'un dépôt en deux questions : le type de lieu, puis son nom et où le trouver. */
export function WarehouseWizard() {
  const t = useTranslations()
  const router = useRouter()
  const { form, submit, pending } = useWarehouseForm(undefined)
  const backToList = () => router.push(Routes.warehouses)

  const steps: WizardStep<WarehouseFormValues>[] = [
    {
      key: "kind",
      illustration: <DepotScene />,
      title: t("warehouses.wizard.kind.title"),
      description: t("warehouses.wizard.kind.description"),
      fields: ["kind"],
      content: <WarehouseKindField form={form} />,
    },
    {
      key: "details",
      illustration: <LocationScene />,
      title: t("warehouses.wizard.details.title"),
      description: t("warehouses.wizard.details.description"),
      fields: ["name", "city", "address"],
      content: <WarehouseDetailsFields form={form} autoFocus />,
    },
  ]

  return (
    <FormWizard
      form={form}
      steps={steps}
      eyebrow={t("warehouses.wizard.eyebrow")}
      nextLabel={t("common.continue")}
      submitLabel={t("warehouses.form.create")}
      submitting={pending}
      exitLabel={t("common.cancel")}
      onExit={backToList}
      onSubmit={async (values) => {
        const saved = await submit(values)
        if (saved) {
          toast.success(t("warehouses.created"))
          router.replace(Routes.warehouses)
        }
        return saved
      }}
    />
  )
}
