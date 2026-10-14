"use client"

import Link from "next/link"
import { useFormatter, useTranslations } from "next-intl"
import { useMemo } from "react"
import { toast } from "sonner"

import { ArchiveControl } from "@/components/catalog/archive-control"
import { EmptyState } from "@/components/catalog/empty-state"
import { FormActions, FormSection } from "@/components/catalog/form-section"
import { SearchScene } from "@/components/illustrations/search-scene"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { VoucherTypeBadge } from "@/components/vouchers/vouchers-screen"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { CatalogStatus, type Item, StockPermission } from "@/lib/api/stock"
import { useItemsPage } from "@/lib/api/stock-queries"
import {
  useSaveSupplier,
  useSupplier,
  useSupplierStatus,
} from "@/lib/api/supplier-queries"
import type { Supplier } from "@/lib/api/suppliers"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { useVouchersPage } from "@/lib/api/voucher-queries"
import { VoucherType } from "@/lib/api/vouchers"
import { RecordRoutes, Routes } from "@/lib/routes"
import { useStockAccess } from "@/components/workspace/stock-access"
import { ReadOnlyNotice } from "@/components/workspace/read-only-notice"

import { SupplierCatalog } from "./supplier-catalog"
import { SupplierFields } from "./supplier-fields"
import { useSupplierForm } from "./use-supplier-form"

/** Articles du catalogue affichés sur la fiche ; au-delà, la recherche les retrouve. */
const CATALOG_PAGE = 100
const LATEST_RECEIPTS = 5

export function SupplierScreen({ id }: { id: string }) {
  const t = useTranslations("suppliers")
  const supplier = useSupplier(id)

  if (supplier.isPending) {
    return (
      <PageBody>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-8 h-64 rounded-2xl" />
      </PageBody>
    )
  }
  if (!supplier.data) {
    return (
      <PageBody>
        <EmptyState
          illustration={<SearchScene />}
          title={t("notFound")}
          description=""
          action={
            <Link
              href={Routes.suppliers}
              className={buttonVariants({ variant: "outline" })}
            >
              {t("title")}
            </Link>
          }
        />
      </PageBody>
    )
  }
  // La clé suit la version : après « Recharger », le formulaire repart de la fiche à jour.
  return (
    <SupplierDetails
      key={supplier.data.version}
      supplier={supplier.data}
      onReload={() => void supplier.refetch()}
    />
  )
}

function SupplierDetails({
  supplier,
  onReload,
}: {
  supplier: Supplier
  onReload: () => void
}) {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const status = useSupplierStatus()
  const canEdit = useStockAccess().can(StockPermission.manageCatalog)
  const archived = supplier.status === CatalogStatus.archived
  const { form, submit, pending } = useSupplierForm(supplier, onReload)

  const changeStatus = (target: CatalogStatus) =>
    status.mutate(
      { id: supplier.id, status: target },
      {
        onSuccess: () =>
          toast.success(
            target === CatalogStatus.archived
              ? t("suppliers.archive.done")
              : t("suppliers.restore.done")
          ),
        onError: (error) => toast.error(errorMessage(error)),
      }
    )

  const onSubmit = form.handleSubmit(async (values) => {
    if (await submit(values, supplier.itemIds))
      toast.success(t("suppliers.saved"))
  })

  return (
    <PageBody>
      <PageHeader
        title={supplier.name}
        breadcrumbs={[
          { label: t("suppliers.title"), href: Routes.suppliers },
          { label: supplier.name },
        ]}
        description={supplier.phone ?? supplier.email ?? undefined}
        className="mb-8"
        actions={
          <>
            {archived && (
              <Badge variant="secondary">{t("suppliers.restore.badge")}</Badge>
            )}
            {canEdit && (
              <ArchiveControl
                archived={archived}
                pending={status.isPending}
                archiveLabels={{
                  action: t("suppliers.archive.action"),
                  title: t("suppliers.archive.title"),
                  description: t("suppliers.archive.description"),
                }}
                restoreLabel={t("suppliers.restore.action")}
                onArchive={() => changeStatus(CatalogStatus.archived)}
                onRestore={() => changeStatus(CatalogStatus.active)}
              />
            )}
          </>
        }
      />
      <FormSection
        title={t("suppliers.catalog.title")}
        description={t("suppliers.catalog.description")}
      >
        <CatalogSection supplier={supplier} readOnly={!canEdit} />
      </FormSection>
      <FormSection title={t("suppliers.receipts.title")}>
        <LatestReceipts supplierId={supplier.id} />
      </FormSection>
      <form onSubmit={(event) => void onSubmit(event)} noValidate>
        {!canEdit && <ReadOnlyNotice />}
        <fieldset disabled={!canEdit} className="contents">
          {/* Première section de son formulaire, mais pas de la page : on garde le filet de séparation. */}
          <FormSection
            title={t("suppliers.form.contact")}
            className="first:border-t first:pt-8"
          >
            <SupplierFields form={form} />
          </FormSection>
        </fieldset>
        {canEdit && (
          <FormActions>
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Spinner />}
              {t("common.save")}
            </Button>
          </FormActions>
        )}
      </form>
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

function LatestReceipts({ supplierId }: { supplierId: string }) {
  const t = useTranslations()
  const format = useFormatter()
  const search = useMemo(
    () => ({ type: VoucherType.receipt, supplierId }),
    [supplierId]
  )
  const receipts = useVouchersPage(search, 0, LATEST_RECEIPTS)
  const rows = receipts.data?.items ?? []

  if (receipts.isSuccess && rows.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        {t("suppliers.receipts.none")}
      </p>
    )
  return (
    <ul className="divide-y rounded-xl border">
      {rows.map((voucher) => (
        <li key={voucher.id}>
          <Link
            href={RecordRoutes.voucher(voucher.id)}
            className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-muted/40"
          >
            <span className="flex items-center gap-2">
              <span className="font-mono font-semibold">{voucher.number}</span>
              <VoucherTypeBadge type={voucher.type} />
            </span>
            <span className="text-sm text-muted-foreground">
              {format.dateTime(new Date(voucher.occurredAt), {
                dateStyle: "medium",
              })}{" "}
              · {voucher.warehouse.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
