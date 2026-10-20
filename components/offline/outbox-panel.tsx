"use client"

import {
  CloudUploadIcon,
  PencilIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import Link from "next/link"
import { useFormatter, useTranslations } from "next-intl"
import { toast } from "sonner"

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
import type { TransferReceiptDraft } from "@/components/vouchers/transfer-receipt-screen"
import { VoucherTypeBadge } from "@/components/vouchers/voucher-badges"
import type { EntryType, VoucherType } from "@/lib/api/vouchers"
import {
  OutboxKind,
  OutboxStatus,
  removeOutboxEntry,
  type OutboxEntry,
} from "@/lib/offline/outbox"
import { useOnline } from "@/lib/offline/use-online"
import { useOutbox } from "@/lib/offline/use-outbox"
import { EntryQueryParams, OUTBOX_ANCHOR, RecordRoutes } from "@/lib/routes"
import { cn } from "@/lib/utils"
import { ENTRY_ROUTES } from "@/lib/vouchers/entry-routes"

/**
 * Ce qui a été saisi sur ce téléphone et n'est pas encore enregistré (D39) : en attente du réseau,
 * ou refusé à l'envoi avec son motif, à reprendre ou à supprimer. Rien quand la file est vide.
 */
export function OutboxPanel() {
  const t = useTranslations("offline.panel")
  const online = useOnline()
  const { entries, pending, rejected } = useOutbox()
  if (entries.length === 0) return null
  return (
    <section
      id={OUTBOX_ANCHOR}
      aria-labelledby="outbox-title"
      className={cn(
        "mt-6 scroll-mt-20 rounded-2xl border p-4 sm:p-5",
        rejected.length > 0
          ? "border-destructive/40 bg-destructive/5"
          : "border-primary/30 bg-primary/5"
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        {rejected.length > 0 ? (
          <TriangleAlertIcon
            className="mt-0.5 size-5 text-destructive"
            aria-hidden
          />
        ) : (
          <CloudUploadIcon className="mt-0.5 size-5 text-primary" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <h2 id="outbox-title" className="text-lg font-semibold">
            {t("title", { count: entries.length })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {rejected.length > 0
              ? t("rejectedHint", { count: rejected.length })
              : online
                ? t("sendingHint", { count: pending.length })
                : t("offlineHint")}
          </p>
        </div>
      </div>
      <ul className="mt-4 divide-y rounded-xl border bg-background">
        {entries.map((entry) => (
          <OutboxRow key={entry.id} entry={entry} />
        ))}
      </ul>
    </section>
  )
}

/**
 * Où reprendre une saisie refusée : l'écran de saisie avec ses valeurs ; pour une réception de
 * transfert, l'envoi à réceptionner (elle se refait à partir de lui).
 */
function resumeHref(entry: OutboxEntry): string {
  if (entry.kind === OutboxKind.transferReceipt)
    return RecordRoutes.transferReceipt(
      (entry.draft as TransferReceiptDraft).transferId
    )
  const type = entry.summary.voucherType as EntryType
  return `${ENTRY_ROUTES[type]}?${EntryQueryParams.draft}=${entry.id}`
}

function OutboxRow({ entry }: { entry: OutboxEntry }) {
  const t = useTranslations("offline.panel")
  const format = useFormatter()
  const rejected = entry.status === OutboxStatus.rejected
  const type = entry.summary.voucherType as VoucherType
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <VoucherTypeBadge type={type} />
          {entry.summary.counterparty && (
            <span className="truncate font-medium">
              {entry.summary.counterparty}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("line", {
            warehouse: entry.summary.warehouseName,
            count: entry.summary.lineCount,
            date: format.dateTime(new Date(entry.createdAt), {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          })}
        </p>
        {rejected && entry.problem && (
          <p className="mt-1 text-sm text-destructive">
            {entry.problem.detail}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {rejected ? (
          <Link
            href={resumeHref(entry)}
            className={buttonVariants({ size: "sm" })}
          >
            <PencilIcon />
            {t("resume")}
          </Link>
        ) : (
          <span className="text-xs font-medium text-primary">
            {t("waiting")}
          </span>
        )}
        <DeleteEntry entry={entry} />
      </div>
    </li>
  )
}

/** Supprimer, c'est perdre la saisie : on le confirme. */
function DeleteEntry({ entry }: { entry: OutboxEntry }) {
  const t = useTranslations("offline.panel")
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={t("delete")} />
        }
      >
        <Trash2Icon />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("keep")}</AlertDialogCancel>
          <AlertDialogCancel
            variant="destructive"
            onClick={() =>
              void removeOutboxEntry(entry.id).then(() =>
                toast.success(t("deleted"))
              )
            }
          >
            {t("delete")}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
