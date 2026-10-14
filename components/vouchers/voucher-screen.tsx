"use client"

import { LockIcon, PrinterIcon } from "lucide-react"
import Link from "next/link"
import { useFormatter, useTranslations } from "next-intl"

import { EmptyState } from "@/components/catalog/empty-state"
import { SearchScene } from "@/components/illustrations/search-scene"
import { useQuantityLabel } from "@/components/items/describe"
import { ItemThumb } from "@/components/items/item-thumb"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useVoucher } from "@/lib/api/voucher-queries"
import { VoucherType } from "@/lib/api/vouchers"
import { RecordRoutes, Routes } from "@/lib/routes"

import { VoucherTypeBadge } from "./vouchers-screen"

/** Bon validé : en lecture seule, une correction passe par un nouveau bon. */
export function VoucherScreen({ id }: { id: string }) {
  const t = useTranslations()
  const format = useFormatter()
  const quantityLabel = useQuantityLabel()
  const voucher = useVoucher(id)

  if (voucher.isPending) {
    return (
      <PageBody>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-8 h-64 rounded-2xl" />
      </PageBody>
    )
  }
  if (!voucher.data) {
    return (
      <PageBody>
        <EmptyState
          illustration={<SearchScene />}
          title={t("vouchers.notFound")}
          description=""
          action={
            <Link
              href={Routes.vouchers}
              className={buttonVariants({ variant: "outline" })}
            >
              {t("vouchers.title")}
            </Link>
          }
        />
      </PageBody>
    )
  }

  const data = voucher.data
  const receipt = data.type === VoucherType.receipt
  const facts = [
    { label: t("vouchers.detail.warehouse"), value: data.warehouse.name },
    {
      label: t("vouchers.detail.date"),
      value: format.dateTime(new Date(data.occurredAt), { dateStyle: "long" }),
    },
    data.counterparty && {
      label: receipt
        ? t("vouchers.detail.supplier")
        : t("vouchers.detail.customer"),
      value: data.counterparty,
    },
    data.documentReference && {
      label: t("vouchers.detail.reference"),
      value: data.documentReference,
    },
    { label: t("vouchers.detail.createdBy"), value: data.createdByName },
  ].filter((fact): fact is { label: string; value: string } => !!fact)

  return (
    <PageBody>
      <PageHeader
        title={data.number}
        breadcrumbs={[
          { label: t("vouchers.title"), href: Routes.vouchers },
          { label: data.number },
        ]}
        description={t("vouchers.detail.recordedAt", {
          date: format.dateTime(new Date(data.recordedAt), {
            dateStyle: "long",
            timeStyle: "short",
          }),
        })}
        actions={
          <>
            <VoucherTypeBadge type={data.type} />
            <Link
              href={RecordRoutes.voucherPrint(data.id)}
              className={buttonVariants({ variant: "outline" })}
            >
              <PrinterIcon />
              {t("vouchers.print.action")}
            </Link>
          </>
        }
      />
      <dl className="mt-8 grid gap-4 rounded-2xl border p-5 sm:grid-cols-2 lg:grid-cols-5">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-sm text-muted-foreground">{fact.label}</dt>
            <dd className="mt-0.5 font-semibold">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">
                {t("vouchers.detail.item")}
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                {t("vouchers.detail.batch")}
              </TableHead>
              <TableHead className="hidden md:table-cell">
                {t("vouchers.detail.entered")}
              </TableHead>
              <TableHead className="pr-4 text-right">
                {t("vouchers.detail.quantity")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.lines.map((line, index) => (
              <TableRow key={`${line.itemId}-${index}`}>
                <TableCell className="py-3 pl-4">
                  <div className="flex items-center gap-3">
                    <ItemThumb imageUrl={line.itemImageUrl} />
                    <div className="min-w-0">
                      <Link
                        href={RecordRoutes.item(line.itemId)}
                        className="font-semibold hover:underline"
                      >
                        {line.itemName}
                      </Link>
                      {line.itemReference && (
                        <p className="font-mono text-xs text-muted-foreground">
                          {line.itemReference}
                        </p>
                      )}
                      {line.batch && (
                        <p className="text-xs text-muted-foreground sm:hidden">
                          {t("vouchers.detail.batch")} {line.batch}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {line.batch ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {line.packagingName ? (
                    `${format.number(line.enteredQuantity)} ${line.packagingName}`
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="pr-4 text-right font-semibold tabular-nums">
                  {receipt ? "+" : "−"}{" "}
                  {quantityLabel(line.baseUnit, line.quantity)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data.note && (
        <div className="mt-6 rounded-2xl border p-5">
          <p className="text-sm text-muted-foreground">
            {t("vouchers.detail.note")}
          </p>
          <p className="mt-1 whitespace-pre-line">{data.note}</p>
        </div>
      )}
      <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <LockIcon className="size-4" aria-hidden />
        {t("vouchers.detail.immutable")}
      </p>
    </PageBody>
  )
}
