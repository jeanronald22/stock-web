"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { FormActions, FormSection } from "@/components/catalog/form-section"
import {
  RecordNotFound,
  RecordSkeleton,
} from "@/components/records/record-states"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { ReadOnlyNotice } from "@/components/workspace/read-only-notice"
import { useStockAccess } from "@/components/workspace/stock-access"
import { useCustomer } from "@/lib/api/customer-queries"
import type { Customer } from "@/lib/api/customers"
import { StockPermission } from "@/lib/api/stock"
import { RecordRoutes, Routes } from "@/lib/routes"

import { CustomerFields } from "./customer-fields"
import { useCustomerForm } from "./use-customer-form"

/** Modification d'un client ou d'un chantier ; la consultation est CustomerDetailScreen. */
export function CustomerEditScreen({ id }: { id: string }) {
  const t = useTranslations("customers")
  const customer = useCustomer(id)
  if (customer.isPending) return <RecordSkeleton />
  if (!customer.data)
    return (
      <RecordNotFound
        title={t("notFound")}
        listLabel={t("title")}
        listHref={Routes.customers}
      />
    )
  // La clé suit la version : après « Recharger », le formulaire repart de la fiche à jour.
  return (
    <CustomerEdit
      key={customer.data.version}
      customer={customer.data}
      onReload={() => void customer.refetch()}
    />
  )
}

function CustomerEdit({
  customer,
  onReload,
}: {
  customer: Customer
  onReload: () => void
}) {
  const t = useTranslations()
  const router = useRouter()
  const manages = useStockAccess().can(StockPermission.manageCatalog)
  const { form, submit, pending } = useCustomerForm(customer, onReload)
  const back = RecordRoutes.customer(customer.id)

  const onSubmit = form.handleSubmit(async (values) => {
    if (!(await submit(values))) return
    toast.success(t("customers.saved"))
    router.push(back)
  })

  return (
    <PageBody>
      <PageHeader
        title={t("customers.detail.editTitle")}
        breadcrumbs={[
          { label: t("customers.title"), href: Routes.customers },
          { label: customer.name, href: back },
          { label: t("records.edit") },
        ]}
        description={customer.name}
        className="mb-8"
      />
      {manages ? (
        <form onSubmit={(event) => void onSubmit(event)} noValidate>
          <FormSection title={t("customers.form.contact")}>
            <CustomerFields form={form} />
          </FormSection>
          <FormActions>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => router.push(back)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Spinner />}
              {t("common.save")}
            </Button>
          </FormActions>
        </form>
      ) : (
        <ReadOnlyNotice />
      )}
    </PageBody>
  )
}
