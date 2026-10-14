"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { CatalogScene } from "@/components/illustrations/catalog-scene"
import { TruckScene } from "@/components/illustrations/truck-scene"
import { FormWizard, type WizardStep } from "@/components/wizard/form-wizard"
import type { Item } from "@/lib/api/stock"
import { RecordRoutes, Routes } from "@/lib/routes"

import { SupplierCatalog } from "./supplier-catalog"
import { SupplierFields } from "./supplier-fields"
import { useSupplierForm, type SupplierFormValues } from "./use-supplier-form"

/** Nouveau fournisseur en deux questions : qui est-ce, que vous livre-t-il (facultatif). */
export function SupplierWizard() {
  const t = useTranslations()
  const router = useRouter()
  const { form, submit, pending } = useSupplierForm(undefined)
  const [catalog, setCatalog] = useState<Item[]>([])

  const steps: WizardStep<SupplierFormValues>[] = [
    {
      key: "identity",
      illustration: <TruckScene />,
      title: t("suppliers.wizard.identity.title"),
      description: t("suppliers.wizard.identity.description"),
      fields: ["name", "phone", "email", "address", "note"],
      content: <SupplierFields form={form} autoFocus />,
    },
    {
      key: "catalog",
      illustration: <CatalogScene />,
      title: t("suppliers.wizard.catalog.title"),
      description: t("suppliers.wizard.catalog.description"),
      fields: [],
      content: (
        <SupplierCatalog
          items={catalog}
          onAdd={(item) => setCatalog((current) => [...current, item])}
          onRemove={(item) =>
            setCatalog((current) =>
              current.filter((candidate) => candidate.id !== item.id)
            )
          }
        />
      ),
    },
  ]

  return (
    <FormWizard
      form={form}
      steps={steps}
      eyebrow={t("suppliers.wizard.eyebrow")}
      nextLabel={t("common.continue")}
      submitLabel={t("suppliers.form.create")}
      submitting={pending}
      exitLabel={t("common.cancel")}
      onExit={() => router.push(Routes.suppliers)}
      onSubmit={async (values) => {
        const supplier = await submit(
          values,
          catalog.map((item) => item.id)
        )
        if (!supplier) return false
        toast.success(t("suppliers.created"))
        router.replace(RecordRoutes.supplier(supplier.id))
        return true
      }}
    />
  )
}
