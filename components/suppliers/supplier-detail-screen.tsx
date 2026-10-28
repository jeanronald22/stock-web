"use client"

import { ArrowDownToLineIcon, Redo2Icon, TruckIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useMemo } from "react"
import { toast } from "sonner"

import { ItemLink } from "@/components/items/item-link"
import { ItemThumb } from "@/components/items/item-thumb"
import { ContactActions } from "@/components/records/contact-actions"
import { RecordActions } from "@/components/records/record-actions"
import {
  RecordSummary,
  RecordSummaryIcon,
} from "@/components/records/record-summary"
import { RecordFacts } from "@/components/records/record-facts"
import {
  RecordNotFound,
  RecordOffline,
  RecordSkeleton,
  RecordState,
  recordState,
} from "@/components/records/record-states"
import { useRecordId } from "@/components/records/use-record-id"
import { useDayAge } from "@/components/records/use-day-age"
import { VoucherHistory } from "@/components/records/voucher-history"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useStockAccess } from "@/components/workspace/stock-access"
import { CatalogStatus, StockPermission } from "@/lib/api/stock"
import { useItemsPage } from "@/lib/api/stock-queries"
import { useSupplier, useSupplierStatus } from "@/lib/api/supplier-queries"
import type { Supplier } from "@/lib/api/suppliers"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { useVouchersPage } from "@/lib/api/voucher-queries"
import { VoucherType } from "@/lib/api/vouchers"
import {
  EntryQueryParams,
  ListQueryParams,
  RecordRoutes,
  Routes,
} from "@/lib/routes"
import { VoucherKind } from "@/lib/vouchers/voucher-kinds"

/** Articles du catalogue montrés sur la fiche ; la liste des articles filtrée montre le reste. */
const CATALOG_PREVIEW = 12

export function SupplierDetailScreen() {
  const t = useTranslations("suppliers")
  const id = useRecordId()
  const supplier = useSupplier(id)
  const list = { listLabel: t("title"), listHref: Routes.suppliers }

  const state = recordState(id, supplier)
  if (state === RecordState.offline) return <RecordOffline {...list} />
  if (state === RecordState.loading) return <RecordSkeleton />
  if (!supplier.data) return <RecordNotFound title={t("notFound")} {...list} />
  return <SupplierDetails supplier={supplier.data} />
}

/**
 * Fiche d'un fournisseur, en consultation : quand il a livré, ce qu'il reste à lui réclamer, ce qu'il
 * livre, et de quoi le joindre. La modification est un écran à part.
 */
function SupplierDetails({ supplier }: { supplier: Supplier }) {
  const t = useTranslations()
  const archived = supplier.status === CatalogStatus.archived
  const history = useMemo(() => ({ supplierId: supplier.id }), [supplier.id])
  return (
    <PageBody>
      <PageHeader
        title={supplier.name}
        breadcrumbs={[
          { label: t("suppliers.title"), href: Routes.suppliers },
          { label: supplier.name },
        ]}
        description={supplier.address ?? undefined}
        badges={
          archived && (
            <Badge variant="secondary">{t("suppliers.restore.badge")}</Badge>
          )
        }
        actions={<SupplierActions supplier={supplier} archived={archived} />}
      />

      <SupplierSummary supplier={supplier} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-8">
          <VoucherHistory
            title={t("suppliers.detail.history")}
            search={history}
            empty={t("suppliers.detail.noHistory")}
            allHref={`${Routes.vouchers}?${ListQueryParams.supplier}=${supplier.id}`}
          />
          <SupplierCatalogPreview supplier={supplier} />
        </div>
        <RecordFacts
          title={t("suppliers.detail.facts")}
          note={supplier.note}
          facts={[
            supplier.phone && {
              label: t("suppliers.form.phone"),
              value: supplier.phone,
            },
            supplier.email && {
              label: t("suppliers.form.email"),
              value: supplier.email,
            },
            supplier.address && {
              label: t("suppliers.form.address"),
              value: supplier.address,
            },
          ]}
        />
      </div>
    </PageBody>
  )
}

/**
 * En tête de fiche : la dernière livraison (ce qu'on vérifie avant de relancer un fournisseur), les
 * réceptions à réclamer s'il y en a, et de quoi le joindre en un geste.
 */
function SupplierSummary({ supplier }: { supplier: Supplier }) {
  const t = useTranslations("suppliers.detail")
  // Au jour près : une livraison ne se suit pas à la seconde.
  const dayAge = useDayAge()
  const receipts = useVouchersPage(
    useMemo(
      () => ({ supplierId: supplier.id, types: [VoucherType.receipt] }),
      [supplier.id]
    ),
    0,
    1
  )
  const gaps = useVouchersPage(
    useMemo(
      () => ({ supplierId: supplier.id, discrepancy: true }),
      [supplier.id]
    ),
    0,
    1
  )
  const last = receipts.data?.items[0]
  const count = receipts.data?.total ?? 0
  const gapCount = gaps.data?.total ?? 0

  return (
    <RecordSummary
      label={t("lastReceipt")}
      visual={<RecordSummaryIcon icon={TruckIcon} />}
      aside={<ContactActions phone={supplier.phone} email={supplier.email} />}
    >
      {receipts.isPending ? (
        <Skeleton className="mt-2 h-9 w-48" />
      ) : last ? (
        <>
          <p className="mt-1 text-2xl font-semibold tracking-tight first-letter:uppercase sm:text-3xl">
            {dayAge(new Date(last.occurredAt))}
          </p>
          <p className="text-muted-foreground">
            {t("receiptCount", { count })}
          </p>
        </>
      ) : (
        <p className="mt-1 text-lg">{t("neverDelivered")}</p>
      )}
      {gapCount > 0 && (
        <Link
          href={`${Routes.vouchers}?${ListQueryParams.voucherType}=${VoucherKind.discrepancies}&${ListQueryParams.supplier}=${supplier.id}`}
          className="mt-3 inline-flex rounded-xl border border-warning/40 bg-warning-muted/60 px-3 py-1.5 text-sm font-semibold text-warning-muted-foreground transition-colors hover:bg-warning-muted"
        >
          {t("gaps", { count: gapCount })}
        </Link>
      )}
    </RecordSummary>
  )
}

/** Ce qu'il livre : son catalogue, enrichi à chaque réception ; il se gère dans « Modifier ». */
function SupplierCatalogPreview({ supplier }: { supplier: Supplier }) {
  const t = useTranslations("suppliers.detail")
  const search = useMemo(() => ({ supplierId: supplier.id }), [supplier.id])
  const items = useItemsPage(search, 0, CATALOG_PREVIEW)
  const rows = items.data?.items ?? []
  const total = items.data?.total ?? 0
  return (
    <section aria-label={t("catalog")}>
      <h2 className="mb-3 text-lg font-semibold">
        {t("catalog")}{" "}
        <span className="font-normal text-muted-foreground">
          · {t("itemCount", { count: total })}
        </span>
      </h2>
      {rows.length === 0 ? (
        !items.isPending && (
          <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
            {t("noCatalog")}
          </p>
        )
      ) : (
        <ul className="flex flex-wrap gap-2">
          {rows.map((item) => (
            <li key={item.id}>
              <ItemLink
                itemId={item.id}
                className="inline-flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm transition-colors hover:bg-muted"
              >
                <ItemThumb
                  imageUrl={item.imageUrl}
                  size="sm"
                  className="size-6 rounded-full"
                />
                {item.name}
              </ItemLink>
            </li>
          ))}
          {total > rows.length && (
            <li>
              <Link
                href={`${Routes.items}?${ListQueryParams.supplier}=${supplier.id}`}
                className="inline-flex rounded-full border px-3 py-1 text-sm font-medium text-primary hover:bg-muted"
              >
                {t("moreItems", { count: total - rows.length })}
              </Link>
            </li>
          )}
        </ul>
      )}
    </section>
  )
}

/** Modifier (catalogue), commencer une réception ou un retour chez lui, archiver ou restaurer. */
function SupplierActions({
  supplier,
  archived,
}: {
  supplier: Supplier
  archived: boolean
}) {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const status = useSupplierStatus()
  const { can } = useStockAccess()
  const manages = can(StockPermission.manageCatalog)
  const records = can(StockPermission.recordMovements) && !archived
  const withSupplier = (route: string) =>
    `${route}?${EntryQueryParams.supplier}=${supplier.id}`
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
  return (
    <RecordActions
      editHref={manages ? RecordRoutes.supplierEdit(supplier.id) : undefined}
      actions={
        records
          ? [
              {
                icon: ArrowDownToLineIcon,
                label: t("suppliers.detail.receive"),
                href: withSupplier(Routes.newReceipt),
              },
              {
                icon: Redo2Icon,
                label: t("suppliers.detail.return"),
                href: withSupplier(Routes.newSupplierReturn),
              },
            ]
          : []
      }
      archive={
        manages
          ? {
              archived,
              labels: {
                action: t("suppliers.archive.action"),
                title: t("suppliers.archive.title"),
                description: t("suppliers.archive.description"),
                restore: t("suppliers.restore.action"),
              },
              onArchive: () => changeStatus(CatalogStatus.archived),
              onRestore: () => changeStatus(CatalogStatus.active),
            }
          : undefined
      }
    />
  )
}
