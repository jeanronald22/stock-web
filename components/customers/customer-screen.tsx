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
import { ReadOnlyNotice } from "@/components/workspace/read-only-notice"
import { useStockAccess } from "@/components/workspace/stock-access"
import { useCustomer, useCustomerStatus } from "@/lib/api/customer-queries"
import type { Customer } from "@/lib/api/customers"
import { CatalogStatus, StockPermission } from "@/lib/api/stock"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { useVouchersPage } from "@/lib/api/voucher-queries"
import { ListQueryParams, RecordRoutes, Routes } from "@/lib/routes"

import { CustomerFields } from "./customer-fields"
import { CustomerKindIcon } from "./customers-screen"
import { useCustomerForm } from "./use-customer-form"

/** Dernières sorties et retours montrés sur la fiche ; la liste des bons montre le reste. */
const LATEST_VOUCHERS = 8

export function CustomerScreen({ id }: { id: string }) {
  const t = useTranslations("customers")
  const customer = useCustomer(id)

  if (customer.isPending) {
    return (
      <PageBody>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-8 h-64 rounded-2xl" />
      </PageBody>
    )
  }
  if (!customer.data) {
    return (
      <PageBody>
        <EmptyState
          illustration={<SearchScene />}
          title={t("notFound")}
          description=""
          action={
            <Link
              href={Routes.customers}
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
    <CustomerDetails
      key={customer.data.version}
      customer={customer.data}
      onReload={() => void customer.refetch()}
    />
  )
}

function CustomerDetails({
  customer,
  onReload,
}: {
  customer: Customer
  onReload: () => void
}) {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const status = useCustomerStatus()
  const canEdit = useStockAccess().can(StockPermission.manageCatalog)
  const archived = customer.status === CatalogStatus.archived
  const { form, submit, pending } = useCustomerForm(customer, onReload)

  const changeStatus = (target: CatalogStatus) =>
    status.mutate(
      { id: customer.id, status: target },
      {
        onSuccess: () =>
          toast.success(
            target === CatalogStatus.archived
              ? t("customers.archive.done")
              : t("customers.restore.done")
          ),
        onError: (error) => toast.error(errorMessage(error)),
      }
    )

  const onSubmit = form.handleSubmit(async (values) => {
    if (await submit(values)) toast.success(t("customers.saved"))
  })

  return (
    <PageBody>
      <PageHeader
        title={customer.name}
        breadcrumbs={[
          { label: t("customers.title"), href: Routes.customers },
          { label: customer.name },
        ]}
        description={[customer.phone, customer.address]
          .filter(Boolean)
          .join(" · ")}
        className="mb-8"
        actions={
          <>
            <Badge variant="outline" className="gap-1">
              <CustomerKindIcon kind={customer.kind} />
              {t(`customers.kinds.${customer.kind}.label`)}
            </Badge>
            {archived && (
              <Badge variant="secondary">{t("customers.restore.badge")}</Badge>
            )}
            {canEdit && (
              <ArchiveControl
                archived={archived}
                pending={status.isPending}
                archiveLabels={{
                  action: t("customers.archive.action"),
                  title: t("customers.archive.title"),
                  description: t("customers.archive.description"),
                }}
                restoreLabel={t("customers.restore.action")}
                onArchive={() => changeStatus(CatalogStatus.archived)}
                onRestore={() => changeStatus(CatalogStatus.active)}
              />
            )}
          </>
        }
      />
      <FormSection
        title={t("customers.vouchers.title")}
        description={t("customers.vouchers.description")}
      >
        <LatestVouchers customerId={customer.id} />
      </FormSection>
      <form onSubmit={(event) => void onSubmit(event)} noValidate>
        {!canEdit && <ReadOnlyNotice />}
        <fieldset disabled={!canEdit} className="contents">
          <FormSection
            title={t("customers.form.contact")}
            className="first:border-t first:pt-8"
          >
            <CustomerFields form={form} />
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

/** Ce qui a été livré à ce client ou ce chantier, et ce qu'il a rapporté. */
function LatestVouchers({ customerId }: { customerId: string }) {
  const t = useTranslations()
  const format = useFormatter()
  const search = useMemo(() => ({ customerId }), [customerId])
  const vouchers = useVouchersPage(search, 0, LATEST_VOUCHERS)
  const rows = vouchers.data?.items ?? []
  const total = vouchers.data?.total ?? 0

  if (vouchers.isSuccess && rows.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        {t("customers.vouchers.none")}
      </p>
    )
  return (
    <div className="space-y-3">
      <ul className="divide-y rounded-xl border">
        {rows.map((voucher) => (
          <li key={voucher.id}>
            <Link
              href={RecordRoutes.voucher(voucher.id)}
              className="flex flex-wrap items-center justify-between gap-3 p-3 transition-colors hover:bg-muted/40"
            >
              <span className="flex items-center gap-2">
                <span className="font-mono font-semibold">
                  {voucher.number}
                </span>
                <VoucherTypeBadge type={voucher.type} />
              </span>
              <span className="text-sm text-muted-foreground">
                {format.dateTime(new Date(voucher.occurredAt), {
                  dateStyle: "medium",
                })}{" "}
                · {voucher.warehouse.name} ·{" "}
                {t("vouchers.lineCount", { count: voucher.lineCount })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {total > rows.length && (
        <Link
          href={`${Routes.vouchers}?${ListQueryParams.customer}=${customerId}`}
          className={buttonVariants({ variant: "outline" })}
        >
          {t("customers.vouchers.all", { count: total })}
        </Link>
      )}
    </div>
  )
}
