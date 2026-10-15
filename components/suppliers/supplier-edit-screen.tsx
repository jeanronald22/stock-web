"use client"

import { useTranslations } from "next-intl"
import { useMemo } from "react"
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
import { type Item, StockPermission } from "@/lib/api/stock"
import { useItemsPage } from "@/lib/api/stock-queries"
import { useSaveSupplier, useSupplier } from "@/lib/api/supplier-queries"
import type { Supplier } from "@/lib/api/suppliers"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { useRouter } from "next/navigation"
import { RecordRoutes, Routes } from "@/lib/routes"

import { SupplierCatalog } from "./supplier-catalog"
import { SupplierFields } from "./supplier-fields"
import { useSupplierForm } from "./use-supplier-form"

/** Articles du catalogue affichés ; au-delà, la recherche les retrouve. */
const CATALOG_PAGE = 100

/** Modification d'un fournisseur (coordonnées, catalogue) ; la consultation est SupplierDetailScreen. */
export function SupplierEditScreen({ id }: { id: string }) {
  const t = useTranslations("suppliers")
  const supplier = useSupplier(id)
  if (supplier.isPending) return <RecordSkeleton />
  if (!supplier.data)
    return (
      <RecordNotFound
        title={t("notFound")}
        listLabel={t("title")}
        listHref={Routes.suppliers}
      />
    )
  // La clé suit la version : après « Recharger », le formulaire repart de la fiche à jour.
  return (
    <SupplierEdit
      key={supplier.data.version}
      supplier={supplier.data}
      onReload={() => void supplier.refetch()}
    />
  )
}

function SupplierEdit({
  supplier,
  onReload,
}: {
  supplier: Supplier
  onReload: () => void
}) {
  const t = useTranslations()
  const router = useRouter()
  const manages = useStockAccess().can(StockPermission.manageCatalog)
  const { form, submit, pending } = useSupplierForm(supplier, onReload)
  const back = RecordRoutes.supplier(supplier.id)

  const onSubmit = form.handleSubmit(async (values) => {
    if (!(await submit(values, supplier.itemIds))) return
    toast.success(t("suppliers.saved"))
    router.push(back)
  })

  return (
    <PageBody>
      <PageHeader
        title={t("suppliers.detail.editTitle")}
        breadcrumbs={[
          { label: t("suppliers.title"), href: Routes.suppliers },
          { label: supplier.name, href: back },
          { label: t("records.edit") },
        ]}
        description={supplier.name}
        className="mb-8"
      />
      {!manages ? (
        <ReadOnlyNotice />
      ) : (
        <>
          <form onSubmit={(event) => void onSubmit(event)} noValidate>
            <FormSection title={t("suppliers.form.contact")}>
              <SupplierFields form={form} />
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
          <FormSection
            title={t("suppliers.catalog.title")}
            description={t("suppliers.catalog.description")}
          >
            <CatalogSection supplier={supplier} readOnly={false} />
          </FormSection>
        </>
      )}
    </PageBody>
  )
}

/** Catalogue sur la fiche : chaque ajout ou retrait est enregistré aussitôt. */
function CatalogSection({
  supplier,
  readOnly,
}: {
  supplier: Supplier
  readOnly: boolean
}) {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const save = useSaveSupplier()
  const search = useMemo(() => ({ supplierId: supplier.id }), [supplier.id])
  const items = useItemsPage(search, 0, CATALOG_PAGE)

  const saveCatalog = (itemIds: string[], message: string) =>
    save.mutate(
      {
        id: supplier.id,
        version: supplier.version,
        input: {
          name: supplier.name,
          phone: supplier.phone ?? undefined,
          email: supplier.email ?? undefined,
          address: supplier.address ?? undefined,
          note: supplier.note ?? undefined,
          itemIds,
        },
      },
      {
        onSuccess: () => toast.success(message),
        onError: (error) => toast.error(errorMessage(error)),
      }
    )

  return (
    <SupplierCatalog
      readOnly={readOnly}
      items={items.data?.items ?? []}
      busy={save.isPending}
      onAdd={(item: Item) =>
        saveCatalog(
          [...supplier.itemIds, item.id],
          t("suppliers.catalog.added")
        )
      }
      onRemove={(item: Item) =>
        saveCatalog(
          supplier.itemIds.filter((id) => id !== item.id),
          t("suppliers.catalog.removed")
        )
      }
    />
  )
}
