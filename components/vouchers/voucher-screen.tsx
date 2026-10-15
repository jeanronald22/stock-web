"use client"

import {
  DownloadIcon,
  LockIcon,
  PackageCheckIcon,
  PrinterIcon,
  Undo2Icon,
} from "lucide-react"
import Link from "next/link"
import { useFormatter, useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { EmptyState } from "@/components/catalog/empty-state"
import { SearchScene } from "@/components/illustrations/search-scene"
import { useQuantityLabel } from "@/components/items/describe"
import { ItemThumb } from "@/components/items/item-thumb"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useStockAccess } from "@/components/workspace/stock-access"
import { StockPermission } from "@/lib/api/stock"
import { useVoucher } from "@/lib/api/voucher-queries"
import {
  movementOf,
  returnTypeOf,
  supplierTypes,
  TransferState,
  VoucherType,
  type ReturnVoucherType,
  type Voucher,
  type VoucherRef,
} from "@/lib/api/vouchers"
import { EntryQueryParams, RecordRoutes, Routes } from "@/lib/routes"

import { useVoucherPdf } from "./use-voucher-pdf"
import { VoucherPhotos } from "./voucher-photos"
import {
  DiscrepancyBadge,
  TransferStateBadge,
  VoucherTypeBadge,
} from "./vouchers-screen"

/** Bon validé : en lecture seule, une correction passe par un nouveau bon. */
export function VoucherScreen({ id }: { id: string }) {
  const t = useTranslations()
  const format = useFormatter()
  const quantityLabel = useQuantityLabel()
  const voucher = useVoucher(id)
  const { can, covers } = useStockAccess()

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
  const adjustment = data.type === VoucherType.adjustment
  // Envoi : départ ici, arrivée en destination. Réception de transfert : départ en source.
  const from = data.destination ? data.warehouse : data.source
  const to = data.destination ?? (data.source ? data.warehouse : null)
  const linked = data.receipt ?? data.transfer
  type Fact = { label: string; value: ReactNode }
  // Un fait absent (pas de tiers, pas de motif) vaut null, "" ou false, puis est retiré.
  const candidates: (Fact | null | false | "")[] = [
    ...(from && to
      ? [
          { label: t("vouchers.detail.from"), value: from.name },
          { label: t("vouchers.detail.to"), value: to.name },
        ]
      : [
          { label: t("vouchers.detail.warehouse"), value: data.warehouse.name },
        ]),
    {
      label: t("vouchers.detail.date"),
      value: format.dateTime(new Date(data.occurredAt), { dateStyle: "long" }),
    },
    data.counterparty && {
      label: supplierTypes.has(data.type)
        ? t("vouchers.detail.supplier")
        : t("vouchers.detail.customer"),
      value: <PartyLink voucher={data} />,
    },
    data.reason && {
      label: t("vouchers.detail.reason"),
      value: t(`vouchers.reasons.${data.reason}.label`),
    },
    data.documentReference && {
      label: t("vouchers.detail.reference"),
      value: data.documentReference,
    },
    data.preparedByName && {
      label: t("vouchers.detail.preparedBy"),
      value: data.preparedByName,
    },
    { label: t("vouchers.detail.createdBy"), value: data.createdByName },
  ]
  const facts = candidates.filter((fact): fact is Fact => !!fact)
  const returnType = returnTypeOf(data.type)
  const canReturn =
    !!returnType &&
    can(StockPermission.recordMovements) &&
    covers(data.warehouse.id)

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
            {data.transferState && (
              <TransferStateBadge state={data.transferState} />
            )}
            {data.hasDiscrepancy && <DiscrepancyBadge />}
            <VoucherPdfActions id={data.id} />
            {data.transferState === TransferState.inTransit &&
              data.destination &&
              covers(data.destination.id) &&
              can(StockPermission.recordMovements) && (
                <Link
                  href={RecordRoutes.transferReceipt(data.id)}
                  className={buttonVariants()}
                >
                  <PackageCheckIcon />
                  {t("vouchers.receive.action")}
                </Link>
              )}
            {canReturn && (
              <Link
                href={`${RETURN_ROUTES[returnType]}?${EntryQueryParams.origin}=${data.id}`}
                className={buttonVariants({ variant: "outline" })}
              >
                <Undo2Icon />
                {t(`vouchers.returns.action.${returnType}`)}
              </Link>
            )}
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

      {linked && (
        <p className="mt-4 text-sm text-muted-foreground">
          {t(
            data.receipt
              ? "vouchers.detail.receivedBy"
              : "vouchers.detail.concludes",
            {
              date: format.dateTime(new Date(linked.occurredAt), {
                dateStyle: "long",
              }),
            }
          )}{" "}
          <Link
            href={RecordRoutes.voucher(linked.id)}
            className="font-mono font-semibold text-foreground hover:underline"
          >
            {linked.number}
          </Link>
        </p>
      )}

      <LinkedVouchers voucher={data} />

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
                  <MovementLabel
                    movement={movementOf(data.type, line)}
                    format={(quantity) =>
                      quantityLabel(line.baseUnit, quantity)
                    }
                  />
                  {line.expectedQuantity !== null &&
                    (adjustment ? (
                      <p className="text-xs font-normal text-muted-foreground">
                        {t("vouchers.detail.counted", {
                          book: quantityLabel(
                            line.baseUnit,
                            line.expectedQuantity
                          ),
                          counted: quantityLabel(line.baseUnit, line.quantity),
                        })}
                      </p>
                    ) : (
                      line.expectedQuantity !== line.quantity && (
                        <p className="text-xs font-normal text-warning-muted-foreground">
                          {t(
                            receipt
                              ? "vouchers.detail.announced"
                              : "vouchers.detail.expected",
                            {
                              quantity: quantityLabel(
                                line.baseUnit,
                                line.expectedQuantity
                              ),
                            }
                          )}
                        </p>
                      )
                    ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data.type === VoucherType.damage && (
        <VoucherPhotos
          voucher={data}
          canAdd={
            can(StockPermission.correctStock) && covers(data.warehouse.id)
          }
        />
      )}

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

const RETURN_ROUTES = {
  [VoucherType.customerReturn]: Routes.newCustomerReturn,
  [VoucherType.supplierReturn]: Routes.newSupplierReturn,
} as const satisfies Record<ReturnVoucherType, string>

/** Le tiers, avec un lien vers sa fiche quand il vient de l'annuaire. */
function PartyLink({ voucher }: { voucher: Voucher }) {
  const href = voucher.customerId
    ? RecordRoutes.customer(voucher.customerId)
    : voucher.supplierId
      ? RecordRoutes.supplier(voucher.supplierId)
      : null
  if (!href) return voucher.counterparty
  return (
    <Link href={href} className="hover:underline">
      {voucher.counterparty}
    </Link>
  )
}

/** Retour : son bon d'origine ; sortie ou réception : ses retours ; ajustement : son inventaire. */
function LinkedVouchers({ voucher }: { voucher: Voucher }) {
  const t = useTranslations("vouchers.detail")
  const link = (ref: VoucherRef) => (
    <Link
      key={ref.id}
      href={RecordRoutes.voucher(ref.id)}
      className="font-mono font-semibold text-foreground hover:underline"
    >
      {ref.number}
    </Link>
  )
  return (
    <>
      {voucher.origin && (
        <p className="mt-4 text-sm text-muted-foreground">
          {t("returnOf")} {link(voucher.origin)}
        </p>
      )}
      {voucher.returns.length > 0 && (
        <p className="mt-4 flex flex-wrap gap-x-2 text-sm text-muted-foreground">
          {t("returns", { count: voucher.returns.length })}
          {voucher.returns.map(link)}
        </p>
      )}
      {voucher.inventoryId && (
        <p className="mt-4 text-sm text-muted-foreground">
          {t("closesInventory")}{" "}
          <Link
            href={RecordRoutes.inventory(voucher.inventoryId)}
            className="font-semibold text-foreground hover:underline"
          >
            {t("seeInventory")}
          </Link>
        </p>
      )}
    </>
  )
}

/** « + 12 pièces », « − 3 pièces », ou « inchangé » pour un comptage conforme. */
function MovementLabel({
  movement,
  format,
}: {
  movement: number
  format: (quantity: number) => string
}) {
  const t = useTranslations("vouchers.detail")
  if (movement === 0)
    return <span className="text-muted-foreground">{t("unchanged")}</span>
  return (
    <>
      {movement > 0 ? "+" : "−"} {format(Math.abs(movement))}
    </>
  )
}

function VoucherPdfActions({ id }: { id: string }) {
  const t = useTranslations("vouchers.print")
  const pdf = useVoucherPdf()
  return (
    <>
      <Button
        variant="outline"
        disabled={pdf.busy}
        onClick={() => void pdf.print(id)}
      >
        {pdf.busy ? <Spinner /> : <PrinterIcon />}
        {t("action")}
      </Button>
      <Button
        variant="outline"
        disabled={pdf.busy}
        onClick={() => void pdf.download(id)}
      >
        <DownloadIcon />
        {t("download")}
      </Button>
    </>
  )
}
