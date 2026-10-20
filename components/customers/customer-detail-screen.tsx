"use client"

import { ArrowUpFromLineIcon, Undo2Icon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo } from "react"
import { toast } from "sonner"

import { ContactActions } from "@/components/records/contact-actions"
import { RecordActions } from "@/components/records/record-actions"
import { RecordSummary } from "@/components/records/record-summary"
import { RecordFacts } from "@/components/records/record-facts"
import {
  RecordNotFound,
  RecordSkeleton,
} from "@/components/records/record-states"
import { useDayAge } from "@/components/records/use-day-age"
import { VoucherHistory } from "@/components/records/voucher-history"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useStockAccess } from "@/components/workspace/stock-access"
import { useCustomer, useCustomerStatus } from "@/lib/api/customer-queries"
import type { Customer } from "@/lib/api/customers"
import { CatalogStatus, StockPermission } from "@/lib/api/stock"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { useVouchersPage } from "@/lib/api/voucher-queries"
import { VoucherType } from "@/lib/api/vouchers"
import {
  EntryQueryParams,
  ListQueryParams,
  RecordRoutes,
  Routes,
} from "@/lib/routes"

import { CustomerKindIcon } from "./customers-screen"

export function CustomerDetailScreen({ id }: { id: string }) {
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
  return <CustomerDetails customer={customer.data} />
}

/**
 * Fiche d'un client ou d'un chantier, en consultation : quand on lui a livré, ce qu'on lui a livré
 * et ce qu'il a rapporté, de quoi le joindre. La modification est un écran à part.
 */
function CustomerDetails({ customer }: { customer: Customer }) {
  const t = useTranslations()
  // Au jour près : une livraison ne se suit pas à la seconde.
  const dayAge = useDayAge()
  const archived = customer.status === CatalogStatus.archived
  const history = useMemo(() => ({ customerId: customer.id }), [customer.id])
  const issues = useVouchersPage(
    useMemo(
      () => ({ customerId: customer.id, types: [VoucherType.issue] }),
      [customer.id]
    ),
    0,
    1
  )
  const last = issues.data?.items[0]

  return (
    <PageBody>
      <PageHeader
        title={customer.name}
        breadcrumbs={[
          { label: t("customers.title"), href: Routes.customers },
          { label: customer.name },
        ]}
        description={customer.address ?? undefined}
        badges={
          archived && (
            <Badge variant="secondary">{t("customers.restore.badge")}</Badge>
          )
        }
        actions={<CustomerActions customer={customer} archived={archived} />}
      />

      <RecordSummary
        label={t("customers.detail.lastIssue")}
        visual={
          <span
            className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-20"
            aria-hidden
          >
            <CustomerKindIcon
              kind={customer.kind}
              className="size-7 sm:size-8"
            />
          </span>
        }
        aside={<ContactActions phone={customer.phone} />}
      >
        {issues.isPending ? (
          <Skeleton className="mt-2 h-9 w-48" />
        ) : last ? (
          <>
            <p className="mt-1 text-2xl font-semibold tracking-tight first-letter:uppercase sm:text-3xl">
              {dayAge(new Date(last.occurredAt))}
            </p>
            <p className="text-muted-foreground">
              {t("customers.detail.issueCount", {
                count: issues.data?.total ?? 0,
              })}
            </p>
          </>
        ) : (
          <p className="mt-1 text-lg">{t("customers.detail.neverServed")}</p>
        )}
      </RecordSummary>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0">
          <VoucherHistory
            title={t("customers.vouchers.title")}
            search={history}
            empty={t("customers.vouchers.none")}
            allHref={`${Routes.vouchers}?${ListQueryParams.customer}=${customer.id}`}
          />
        </div>
        <RecordFacts
          title={t("customers.detail.facts")}
          note={customer.note}
          facts={[
            {
              label: t("customers.form.kind"),
              value: t(`customers.kinds.${customer.kind}.label`),
            },
            customer.phone && {
              label: t("customers.form.phone"),
              value: customer.phone,
            },
            customer.address && {
              label: t("customers.form.address"),
              value: customer.address,
            },
          ]}
        />
      </div>
    </PageBody>
  )
}

/** Modifier (catalogue), lui faire une sortie ou enregistrer son retour, archiver ou restaurer. */
function CustomerActions({
  customer,
  archived,
}: {
  customer: Customer
  archived: boolean
}) {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const status = useCustomerStatus()
  const { can } = useStockAccess()
  const manages = can(StockPermission.manageCatalog)
  const records = can(StockPermission.recordMovements) && !archived
  const withCustomer = (route: string) =>
    `${route}?${EntryQueryParams.customer}=${customer.id}`
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
  return (
    <RecordActions
      editHref={manages ? RecordRoutes.customerEdit(customer.id) : undefined}
      actions={
        records
          ? [
              {
                icon: ArrowUpFromLineIcon,
                label: t("customers.detail.issue"),
                href: withCustomer(Routes.newIssue),
              },
              {
                icon: Undo2Icon,
                label: t("customers.detail.return"),
                href: withCustomer(Routes.newCustomerReturn),
              },
            ]
          : []
      }
      archive={
        manages
          ? {
              archived,
              labels: {
                action: t("customers.archive.action"),
                title: t("customers.archive.title"),
                description: t("customers.archive.description"),
                restore: t("customers.restore.action"),
              },
              onArchive: () => changeStatus(CatalogStatus.archived),
              onRestore: () => changeStatus(CatalogStatus.active),
            }
          : undefined
      }
    />
  )
}
