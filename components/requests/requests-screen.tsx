"use client"

import { ChevronRightIcon } from "lucide-react"
import Link from "next/link"
import { useFormatter, useTranslations } from "next-intl"
import { useState } from "react"

import { EmptyState } from "@/components/catalog/empty-state"
import { TablePagination } from "@/components/catalog/table-pagination"
import { ValidatedScene } from "@/components/illustrations/validated-scene"
import { ItemsTableSkeleton } from "@/components/items/items-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  NewVoucherButtons,
  VoucherTypeBadge,
} from "@/components/vouchers/vouchers-screen"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useRequests } from "@/lib/api/request-queries"
import { RequestStatus, requestStatuses } from "@/lib/api/voucher-requests"
import { DEFAULT_PAGE_SIZE } from "@/lib/list/use-list-params"
import { RecordRoutes } from "@/lib/routes"
import { cn } from "@/lib/utils"

import { RequestStatusBadge } from "./request-status-badge"
import { VouchersTabs } from "./vouchers-tabs"

const SKELETON_ROWS = 5

/**
 * Demandes de sortie (D33), dans « Bons » : celles qu'on peut valider et les siennes. On part de
 * ce qui attend une décision.
 */
export function RequestsScreen() {
  const t = useTranslations("requests")
  const format = useFormatter()
  const [status, setStatus] = useState<RequestStatus>(RequestStatus.pending)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE)
  const requests = useRequests(status, page, size)
  const rows = requests.data?.items ?? []
  const total = requests.data?.total ?? 0

  return (
    <PageBody>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<NewVoucherButtons />}
      />
      <VouchersTabs />
      <ToggleGroup
        aria-label={t("statusFilter")}
        variant="outline"
        className="mt-6 flex-wrap"
        value={[status]}
        onValueChange={(values: string[]) => {
          const next = requestStatuses.find(
            (candidate) => candidate === values[0]
          )
          if (!next) return
          setStatus(next)
          setPage(0)
        }}
      >
        {requestStatuses.map((value) => (
          <ToggleGroupItem key={value} value={value}>
            {t(`filters.${value}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="mt-6 overflow-hidden rounded-2xl border">
        {requests.isPending ? (
          <ItemsTableSkeleton rows={SKELETON_ROWS} />
        ) : total === 0 ? (
          <EmptyState
            illustration={<ValidatedScene />}
            title={t(`empty.${status}.title`)}
            description={t(`empty.${status}.description`)}
          />
        ) : (
          <>
            <Table
              className={cn(
                "transition-opacity",
                requests.isPlaceholderData && "opacity-60"
              )}
            >
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">{t("table.request")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("table.warehouse")}
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t("table.preparedBy")}
                  </TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((request) => (
                  <TableRow
                    key={request.id}
                    className="relative cursor-pointer"
                  >
                    <TableCell className="py-3 pl-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={RecordRoutes.request(request.id)}
                          className="font-semibold after:absolute after:inset-0 focus-visible:outline-none"
                        >
                          {request.counterparty ??
                            request.destination?.name ??
                            t("noCounterparty")}
                        </Link>
                        <VoucherTypeBadge type={request.type} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("lineCount", { count: request.lineCount })} ·{" "}
                        {format.dateTime(new Date(request.requestedAt), {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        <span className="md:hidden">
                          {" "}
                          · {request.warehouse.name}
                        </span>
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {request.destination
                        ? `${request.warehouse.name} → ${request.destination.name}`
                        : request.warehouse.name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {request.requestedByName}
                    </TableCell>
                    <TableCell>
                      <RequestStatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="pr-4 text-muted-foreground">
                      <ChevronRightIcon className="size-4" aria-hidden />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              page={page}
              size={size}
              total={total}
              onPageChange={setPage}
              onSizeChange={(next) => {
                setSize(next)
                setPage(0)
              }}
            />
          </>
        )}
      </div>
    </PageBody>
  )
}
