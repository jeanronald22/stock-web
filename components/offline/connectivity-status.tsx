"use client"

import { CloudUploadIcon, TriangleAlertIcon, WifiOffIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { useOnline } from "@/lib/offline/use-online"
import { useOutbox } from "@/lib/offline/use-outbox"
import { OUTBOX_ANCHOR, Routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

/** Ce que l'indicateur signale, du plus urgent au moins urgent. */
const Tone = {
  rejected: "rejected",
  pending: "pending",
  offline: "offline",
} as const

/**
 * État hors ligne dans l'en-tête (D39) : rien quand tout va bien ; sinon « Hors ligne », les bons qui
 * attendent le réseau ou ceux à corriger. Un toucher mène à la liste « À envoyer ».
 */
export function ConnectivityStatus() {
  const t = useTranslations("offline.status")
  const online = useOnline()
  const { pending, rejected } = useOutbox()
  if (online && pending.length === 0 && rejected.length === 0) return null

  const tone =
    rejected.length > 0 ? Tone.rejected : online ? Tone.pending : Tone.offline
  const Icon =
    tone === Tone.rejected
      ? TriangleAlertIcon
      : tone === Tone.pending
        ? CloudUploadIcon
        : WifiOffIcon
  const label =
    tone === Tone.rejected
      ? t("rejected", { count: rejected.length })
      : tone === Tone.pending
        ? t("pending", { count: pending.length })
        : pending.length > 0
          ? t("offlineWithPending", { count: pending.length })
          : t("offline")

  return (
    <Link
      href={`${Routes.vouchers}#${OUTBOX_ANCHOR}`}
      role="status"
      aria-label={label}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition-colors",
        tone === Tone.offline &&
          "border-warning/50 bg-warning-muted text-warning-muted-foreground",
        tone === Tone.pending && "border-primary/40 bg-primary/10 text-primary",
        tone === Tone.rejected &&
          "border-destructive/40 bg-destructive/10 text-destructive"
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {/* Téléphone : l'icône et le nombre suffisent, l'en-tête est étroit. */}
      <span className="hidden sm:inline">{label}</span>
      {pending.length + rejected.length > 0 && (
        <span className="tabular-nums sm:hidden">
          {pending.length + rejected.length}
        </span>
      )}
    </Link>
  )
}
