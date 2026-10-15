"use client"

import {
  ArrowDownToLineIcon,
  ArrowRightLeftIcon,
  ArrowUpFromLineIcon,
  ChevronDownIcon,
  ClipboardCheckIcon,
  PackageXIcon,
  Redo2Icon,
  Undo2Icon,
  DownloadIcon,
  EllipsisVerticalIcon,
  FileTextIcon,
  PrinterIcon,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useFormatter, useTranslations } from "next-intl"
import { useMemo } from "react"

import { ClearFilters } from "@/components/catalog/clear-filters"
import { EmptyState } from "@/components/catalog/empty-state"
import { VouchersTabs } from "@/components/requests/vouchers-tabs"
import { SupplierFilter } from "@/components/catalog/supplier-filter"
import { TablePagination } from "@/components/catalog/table-pagination"
import { WarehouseFilter } from "@/components/catalog/warehouse-filter"
import { DocumentScene } from "@/components/illustrations/document-scene"
import { ItemsTableSkeleton } from "@/components/items/items-table"
import { usePageTour } from "@/components/tour/tour-provider"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useVouchersPage } from "@/lib/api/voucher-queries"
import { StockPermission } from "@/lib/api/stock"
import {
  TransferState,
  VoucherType,
  type VoucherSummary,
} from "@/lib/api/vouchers"
import { VOUCHER_KIND_SEARCH, VoucherKind } from "@/lib/vouchers/voucher-kinds"
import { useListParams } from "@/lib/list/use-list-params"
import { RecordRoutes, Routes } from "@/lib/routes"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"
import { cn } from "@/lib/utils"
import { useStockAccess } from "@/components/workspace/stock-access"

import { PeriodFilter } from "./period-filter"
import { useVoucherPdf } from "./use-voucher-pdf"

const ALL_TYPES = "all"
const SKELETON_ROWS = 8

const TYPE_ICONS: Record<VoucherType, LucideIcon> = {
  [VoucherType.receipt]: ArrowDownToLineIcon,
  [VoucherType.issue]: ArrowUpFromLineIcon,
  [VoucherType.transferOut]: ArrowRightLeftIcon,
  [VoucherType.transferIn]: ArrowRightLeftIcon,
  [VoucherType.damage]: PackageXIcon,
  [VoucherType.adjustment]: ClipboardCheckIcon,
  [VoucherType.customerReturn]: Undo2Icon,
  [VoucherType.supplierReturn]: Redo2Icon,
}

const TYPE_BADGES: Record<
  VoucherType,
  "success" | "secondary" | "info" | "danger" | "warning"
> = {
  [VoucherType.receipt]: "success",
  [VoucherType.issue]: "secondary",
  [VoucherType.transferOut]: "info",
  [VoucherType.transferIn]: "info",
  [VoucherType.damage]: "danger",
  [VoucherType.adjustment]: "warning",
  [VoucherType.customerReturn]: "success",
  [VoucherType.supplierReturn]: "secondary",
}

export function VoucherTypeBadge({ type }: { type: VoucherType }) {
  const t = useTranslations("vouchers.types")
  const Icon = TYPE_ICONS[type]
  return (
    <Badge variant={TYPE_BADGES[type]} className="gap-1">
      <Icon className="size-3" aria-hidden />
      {t(type)}
    </Badge>
  )
}

/** « Dépôt Bonabéri → Boutique Akwa » pour un envoi de transfert. */
function warehouseLabel(voucher: VoucherSummary): string {
  return voucher.destination
    ? `${voucher.warehouse.name} → ${voucher.destination.name}`
    : voucher.warehouse.name
}

/** Reçu autrement qu'attendu : à vérifier, voire à réclamer au fournisseur (D28). */
export function DiscrepancyBadge() {
  const t = useTranslations("vouchers")
  return <Badge variant="warning">{t("discrepancy")}</Badge>
}

/** « En transit » tant que l'envoi n'est pas réceptionné, puis « Reçu ». */
export function TransferStateBadge({ state }: { state: TransferState }) {
  const t = useTranslations("vouchers.transferState")
  return (
    <Badge variant={state === TransferState.inTransit ? "warning" : "success"}>
      {t(state)}
    </Badge>
  )
}

/**
 * Actions de création, communes à la liste et à l'écran vide : réception et sortie, les plus
 * fréquentes, en boutons ; transfert, casse et ajustement dans « Autre opération ».
 */
export function NewVoucherButtons({ className }: { className?: string }) {
  const t = useTranslations("vouchers")
  const router = useRouter()
  const { can } = useStockAccess()
  if (!can(StockPermission.recordMovements)) return null
  const corrects = can(StockPermission.correctStock)
  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      {...tourAnchor(TourAnchors.newVoucher)}
    >
      <Link href={Routes.newReceipt} className={buttonVariants({ size: "lg" })}>
        <ArrowDownToLineIcon />
        {t("newReceipt")}
      </Link>
      <Link
        href={Routes.newIssue}
        className={buttonVariants({ size: "lg", variant: "outline" })}
      >
        <ArrowUpFromLineIcon />
        {t("newIssue")}
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="lg" variant="outline" />}>
          {t("otherOperation")}
          <ChevronDownIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem onClick={() => router.push(Routes.newTransfer)}>
            <ArrowRightLeftIcon />
            <OperationLabel
              title={t("newTransfer")}
              hint={t("operations.transfer")}
            />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(Routes.newCustomerReturn)}
          >
            <Undo2Icon />
            <OperationLabel
              title={t("newCustomerReturn")}
              hint={t("operations.customerReturn")}
            />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(Routes.newSupplierReturn)}
          >
            <Redo2Icon />
            <OperationLabel
              title={t("newSupplierReturn")}
              hint={t("operations.supplierReturn")}
            />
          </DropdownMenuItem>
          {corrects && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(Routes.newDamage)}>
                <PackageXIcon />
                <OperationLabel
                  title={t("newDamage")}
                  hint={t("operations.damage")}
                />
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(Routes.newAdjustment)}
              >
                <ClipboardCheckIcon />
                <OperationLabel
                  title={t("newAdjustment")}
                  hint={t("operations.adjustment")}
                />
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function OperationLabel({ title, hint }: { title: string; hint: string }) {
  return (
    <span className="grid">
      <span>{title}</span>
      <span className="text-xs font-normal text-muted-foreground">{hint}</span>
    </span>
  )
}

export function VouchersScreen() {
  const t = useTranslations("vouchers")
  const format = useFormatter()
  const list = useListParams()
  const {
    warehouseIds,
    voucherKind,
    supplierId,
    customerId,
    itemId,
    from,
    to,
    order,
    page,
    size,
  } = list.params
  const search = useMemo(
    () => ({
      ...(voucherKind && VOUCHER_KIND_SEARCH[voucherKind]),
      warehouseIds,
      supplierId,
      customerId,
      itemId,
      from,
      to,
      order,
    }),
    [voucherKind, warehouseIds, supplierId, customerId, itemId, from, to, order]
  )
  const vouchers = useVouchersPage(search, page, size)
  const total = vouchers.data?.total ?? 0
  const empty = vouchers.isSuccess && total === 0 && !list.filtered
  usePageTour("vouchers", { ready: vouchers.isSuccess })

  const typeOptions = [
    { value: ALL_TYPES, label: t("allTypes") },
    ...Object.entries(VoucherKind).map(([key, kind]) => ({
      value: kind,
      label: t(`kinds.${key as keyof typeof VoucherKind}`),
    })),
  ]

  return (
    <PageBody>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={empty ? undefined : <NewVoucherButtons />}
      />
      <VouchersTabs />
      {empty ? (
        <EmptyState
          illustration={<DocumentScene />}
          title={t("empty.title")}
          description={t("empty.description")}
          action={<NewVoucherButtons className="justify-center" />}
        />
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Select
              items={typeOptions}
              value={voucherKind ?? ALL_TYPES}
              onValueChange={(value) =>
                list.setVoucherKind(
                  Object.values(VoucherKind).find((kind) => kind === value)
                )
              }
            >
              <SelectTrigger
                className="w-full sm:w-52"
                aria-label={t("allTypes")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <WarehouseFilter
              value={warehouseIds}
              onChange={list.setWarehouses}
            />
            <SupplierFilter value={supplierId} onChange={list.setSupplier} />
            <PeriodFilter
              from={from}
              to={to}
              order={order}
              onPeriodChange={list.setPeriod}
              onOrderChange={list.setOrder}
            />
            <ClearFilters visible={list.filtered} onClear={list.reset} />
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border">
            {vouchers.isPending ? (
              <ItemsTableSkeleton rows={SKELETON_ROWS} />
            ) : total === 0 ? (
              <div className="p-10 text-center">
                <p className="text-muted-foreground">{t("noResult")}</p>
                <Button variant="outline" className="mt-4" onClick={list.reset}>
                  {t("clearFilters")}
                </Button>
              </div>
            ) : (
              <>
                <Table
                  className={cn(
                    "transition-opacity",
                    vouchers.isPlaceholderData && "opacity-60"
                  )}
                >
                  <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">
                        {t("table.number")}
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t("table.date")}
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t("table.warehouse")}
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        {t("table.counterparty")}
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        {t("table.createdBy")}
                      </TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(vouchers.data?.items ?? []).map((voucher) => (
                      <TableRow
                        key={voucher.id}
                        className="relative cursor-pointer"
                      >
                        <TableCell className="py-3 pl-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={RecordRoutes.voucher(voucher.id)}
                              className="font-mono font-semibold after:absolute after:inset-0 focus-visible:outline-none"
                            >
                              {voucher.number}
                            </Link>
                            <VoucherTypeBadge type={voucher.type} />
                            {voucher.transferState && (
                              <TransferStateBadge
                                state={voucher.transferState}
                              />
                            )}
                            {voucher.hasDiscrepancy && <DiscrepancyBadge />}
                          </div>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {format.dateTime(new Date(voucher.occurredAt), {
                              dateStyle: "medium",
                            })}{" "}
                            · {warehouseLabel(voucher)}
                          </p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {format.dateTime(new Date(voucher.occurredAt), {
                            dateStyle: "medium",
                          })}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {warehouseLabel(voucher)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {voucher.counterparty ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {t("lineCount", { count: voucher.lineCount })}
                          </p>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {voucher.createdByName}
                        </TableCell>
                        <TableCell className="pr-2">
                          <VoucherRowMenu
                            id={voucher.id}
                            number={voucher.number}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  page={page}
                  size={size}
                  total={total}
                  onPageChange={list.setPage}
                  onSizeChange={list.setSize}
                />
              </>
            )}
          </div>
        </>
      )}
    </PageBody>
  )
}

/**
 * Actions d'une ligne de bon. Le bouton passe au-dessus du lien qui couvre la ligne : l'ouvrir ne
 * déclenche pas la navigation vers la fiche.
 */
function VoucherRowMenu({ id, number }: { id: string; number: string }) {
  const t = useTranslations("vouchers.menu")
  const router = useRouter()
  const pdf = useVoucherPdf()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative z-10"
            aria-label={t("open", { number })}
          />
        }
      >
        <EllipsisVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => router.push(RecordRoutes.voucher(id))}>
          <FileTextIcon />
          {t("detail")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={pdf.busy}
          onClick={() => void pdf.print(id)}
        >
          <PrinterIcon />
          {t("print")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={pdf.busy}
          onClick={() => void pdf.download(id)}
        >
          <DownloadIcon />
          {t("download")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
