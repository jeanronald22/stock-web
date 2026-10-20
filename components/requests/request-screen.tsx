"use client"

import {
  CheckIcon,
  CircleAlertIcon,
  RotateCcwIcon,
  Undo2Icon,
  XIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useFormatter, useTranslations } from "next-intl"
import { useState, type ReactNode } from "react"
import { toast } from "sonner"

import { EmptyState } from "@/components/catalog/empty-state"
import { SearchScene } from "@/components/illustrations/search-scene"
import { useQuantityLabel } from "@/components/items/describe"
import { ItemThumb } from "@/components/items/item-thumb"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { VoucherTypeBadge } from "@/components/vouchers/vouchers-screen"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import {
  useApproveRequest,
  useRejectRequest,
  useRequest,
  useWithdrawRequest,
} from "@/lib/api/request-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import {
  DECISION_NOTE_MAX,
  RequestStatus,
  type VoucherRequest,
} from "@/lib/api/voucher-requests"
import { shortagesOf, type Shortage } from "@/lib/api/vouchers"
import { EntryQueryParams, RecordRoutes, Routes } from "@/lib/routes"
import { cn } from "@/lib/utils"
import { ENTRY_ROUTES } from "@/lib/vouchers/entry-routes"

import { RequestStatusBadge } from "./request-status-badge"

export function RequestScreen({ id }: { id: string }) {
  const t = useTranslations("requests")
  const request = useRequest(id)
  if (request.isPending) {
    return (
      <PageBody>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-8 h-64 rounded-2xl" />
      </PageBody>
    )
  }
  if (!request.data) {
    return (
      <PageBody>
        <EmptyState
          illustration={<SearchScene />}
          title={t("notFound")}
          description=""
          action={
            <Link
              href={Routes.requests}
              className={buttonVariants({ variant: "outline" })}
            >
              {t("title")}
            </Link>
          }
        />
      </PageBody>
    )
  }
  return <RequestDetails request={request.data} />
}

/**
 * Une demande de sortie (D33) : ce qui est demandé face au stock de l'instant, puis la décision.
 * En attente, le valideur valide ou refuse ; la personne qui l'a préparée peut la retirer.
 */
function RequestDetails({ request }: { request: VoucherRequest }) {
  const t = useTranslations("requests")
  const format = useFormatter()
  const quantityLabel = useQuantityLabel()
  const [shortages, setShortages] = useState<Shortage[]>([])
  const date = (value: string) =>
    format.dateTime(new Date(value), { dateStyle: "long", timeStyle: "short" })

  const facts: { label: string; value: ReactNode }[] = [
    {
      label: request.destination ? t("detail.from") : t("detail.warehouse"),
      value: request.warehouse.name,
    },
    ...(request.destination
      ? [{ label: t("detail.to"), value: request.destination.name }]
      : []),
    ...(request.counterparty
      ? [{ label: t("detail.counterparty"), value: request.counterparty }]
      : []),
    ...(request.documentReference
      ? [{ label: t("detail.reference"), value: request.documentReference }]
      : []),
    { label: t("detail.preparedBy"), value: request.requestedByName },
  ]

  return (
    <PageBody>
      <PageHeader
        title={t(`detail.title.${request.type}`)}
        breadcrumbs={[
          { label: t("title"), href: Routes.requests },
          { label: t("detail.breadcrumb") },
        ]}
        description={t("detail.preparedOn", {
          date: date(request.requestedAt),
        })}
        badges={
          <>
            <VoucherTypeBadge type={request.type} />
            <RequestStatusBadge status={request.status} />
          </>
        }
      />

      <Decision request={request} date={date} />

      <dl className="mt-6 grid gap-4 rounded-2xl border p-5 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-sm text-muted-foreground">{fact.label}</dt>
            <dd className="mt-0.5 font-semibold">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <ul className="mt-6 space-y-2" aria-label={t("detail.lines")}>
        {request.lines.map((line, index) => {
          const batch = line.batch ?? ""
          const shortage = shortages.find(
            (candidate) =>
              candidate.itemId === line.item.id && candidate.batch === batch
          )
          // Stock de l'instant : au-dessous de la demande, la validation sera refusée.
          const short =
            request.status === RequestStatus.pending &&
            line.quantity !== null &&
            line.quantity > line.available
          return (
            <li
              key={`${line.item.id}-${index}`}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-xl border p-3",
                (short || shortage) && "border-destructive/50 bg-destructive/5"
              )}
            >
              <ItemThumb imageUrl={line.item.imageUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{line.item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[
                    line.item.reference,
                    line.batch && t("detail.batch", { batch: line.batch }),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold tabular-nums">
                  {line.packagingName
                    ? `${format.number(line.enteredQuantity)} ${line.packagingName}`
                    : quantityLabel(line.item.baseUnit, line.enteredQuantity)}
                  {line.packagingName && line.quantity !== null && (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      = {quantityLabel(line.item.baseUnit, line.quantity)}
                    </span>
                  )}
                </p>
                {request.status === RequestStatus.pending && (
                  <p
                    className={cn(
                      "text-xs",
                      short || shortage
                        ? "font-medium text-destructive"
                        : "text-muted-foreground"
                    )}
                  >
                    {t("detail.available", {
                      quantity: quantityLabel(
                        line.item.baseUnit,
                        shortage?.available ?? line.available
                      ),
                    })}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {request.note && (
        <div className="mt-6 rounded-2xl border p-5">
          <p className="text-sm text-muted-foreground">{t("detail.note")}</p>
          <p className="mt-1 whitespace-pre-line">{request.note}</p>
        </div>
      )}

      {(request.canDecide || request.canWithdraw) && (
        <Actions request={request} onShortages={setShortages} />
      )}
    </PageBody>
  )
}

/** Où en est la demande, en une phrase ; avec le bon, le motif, ou le moyen de la refaire. */
function Decision({
  request,
  date,
}: {
  request: VoucherRequest
  date: (value: string) => string
}) {
  const t = useTranslations("requests.decision")
  const by = {
    name: request.decidedByName ?? "",
    date: request.decidedAt ? date(request.decidedAt) : "",
  }
  switch (request.status) {
    case RequestStatus.pending:
      return (
        <p className="mt-6 flex items-center gap-2 rounded-xl border border-warning/40 bg-warning-muted/50 px-4 py-3 text-sm">
          <CircleAlertIcon
            className="size-4 text-warning-muted-foreground"
            aria-hidden
          />
          {request.canDecide ? t("pendingForYou") : t("pending")}
        </p>
      )
    case RequestStatus.approved:
      return (
        <p className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-success/40 bg-success-muted/50 px-4 py-3 text-sm">
          <CheckIcon
            className="size-4 text-success-muted-foreground"
            aria-hidden
          />
          {t("approved", by)}
          {request.voucher && (
            <Link
              href={RecordRoutes.voucher(request.voucher.id)}
              className="font-mono font-semibold hover:underline"
            >
              {request.voucher.number}
            </Link>
          )}
        </p>
      )
    case RequestStatus.rejected:
    case RequestStatus.withdrawn:
      return (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
          <div>
            <p>
              {request.status === RequestStatus.rejected
                ? t("rejected", by)
                : t("withdrawn", by)}
            </p>
            {request.decisionNote && (
              <p className="mt-1 font-medium">« {request.decisionNote} »</p>
            )}
          </div>
          <Link
            href={`${ENTRY_ROUTES[request.type]}?${EntryQueryParams.fromRequest}=${request.id}`}
            className={buttonVariants({ variant: "outline" })}
          >
            <RotateCcwIcon />
            {t("redo")}
          </Link>
        </div>
      )
  }
}

function Actions({
  request,
  onShortages,
}: {
  request: VoucherRequest
  onShortages: (shortages: Shortage[]) => void
}) {
  const t = useTranslations("requests.actions")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const errorMessage = useErrorMessage()
  const approve = useApproveRequest()
  const reject = useRejectRequest()
  const withdraw = useWithdrawRequest()
  const [note, setNote] = useState("")
  const [noteError, setNoteError] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  const doApprove = async () => {
    try {
      const approved = await approve.mutateAsync(request.id)
      onShortages([])
      toast.success(t("approved", { number: approved.voucher?.number ?? "" }), {
        action: approved.voucher
          ? {
              label: t("seeVoucher"),
              onClick: () =>
                router.push(RecordRoutes.voucher(approved.voucher!.id)),
            }
          : undefined,
      })
    } catch (error) {
      const shortages = shortagesOf(error)
      onShortages(shortages)
      toast.error(shortages.length > 0 ? t("shortages") : errorMessage(error))
    }
  }

  const doReject = async () => {
    if (!note.trim()) return setNoteError(true)
    try {
      await reject.mutateAsync({ id: request.id, note: note.trim() })
      setRejecting(false)
      toast.success(t("rejected"))
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex flex-wrap justify-end gap-2 border-t bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:-mx-6 sm:px-6">
      {request.canWithdraw && (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                className="mr-auto text-muted-foreground"
              />
            }
          >
            <Undo2Icon />
            {t("withdraw")}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("withdrawTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("withdrawDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
              <AlertDialogCancel
                variant="destructive"
                onClick={() =>
                  withdraw
                    .mutateAsync(request.id)
                    .then(() => toast.success(t("withdrawn")))
                    .catch((error: unknown) => toast.error(errorMessage(error)))
                }
              >
                {t("withdraw")}
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {request.canDecide && (
        <>
          <Dialog open={rejecting} onOpenChange={setRejecting}>
            <DialogTrigger render={<Button variant="outline" size="lg" />}>
              <XIcon />
              {t("reject")}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("rejectTitle")}</DialogTitle>
                <DialogDescription>
                  {t("rejectDescription", { name: request.requestedByName })}
                </DialogDescription>
              </DialogHeader>
              <Field data-invalid={noteError}>
                <FieldLabel htmlFor="reject-note">{t("rejectNote")}</FieldLabel>
                <Textarea
                  id="reject-note"
                  rows={3}
                  autoFocus
                  maxLength={DECISION_NOTE_MAX}
                  value={note}
                  aria-invalid={noteError}
                  placeholder={t("rejectNotePlaceholder")}
                  onChange={(event) => {
                    setNote(event.target.value)
                    setNoteError(false)
                  }}
                />
                {noteError && (
                  <FieldError errors={[{ message: t("rejectNoteRequired") }]} />
                )}
              </Field>
              <DialogFooter>
                <Button
                  variant="destructive"
                  disabled={reject.isPending}
                  onClick={() => void doReject()}
                >
                  {reject.isPending && <Spinner />}
                  {t("reject")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            size="lg"
            disabled={approve.isPending}
            onClick={() => void doApprove()}
          >
            {approve.isPending ? <Spinner /> : <CheckIcon />}
            {t("approve")}
          </Button>
        </>
      )}
    </div>
  )
}
