"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useRef } from "react"
import { useAuth } from "react-oidc-context"
import { toast } from "sonner"

import { useApi } from "@/lib/api/api-provider"
import { ApiError, ProblemCode } from "@/lib/api/problem"
import { stockKeys } from "@/lib/api/stock-queries"
import { useTokenRenewal } from "@/lib/auth/token-renewal"
import { isOnline } from "@/lib/offline/connectivity"
import {
  outboxSnapshot,
  OutboxStatus,
  putOutboxEntry,
  removeOutboxEntry,
  type OutboxEntry,
} from "@/lib/offline/outbox"
import { useOnline } from "@/lib/offline/use-online"
import { useOutbox } from "@/lib/offline/use-outbox"
import { useActiveOrganization } from "@/lib/organization/active-organization"
import { Routes } from "@/lib/routes"

/** Tant qu'il reste des envois, on réessaie à ce rythme (réseau qui va et vient). */
const RETRY_MS = 30_000
/** Un seul onglet envoie à la fois (l'envoi est idempotent ; le verrou évite le travail en double). */
const LOCK_NAME = "kreskala.outbox"
const UNAUTHORIZED = 401
const TOO_MANY_REQUESTS = 429
const SERVER_ERROR = 500
/** Ce qu'un envoi réussi renvoie : un bon a un numéro, une demande non. */
type Sent = { number?: string }

/** Ce qu'on fait d'une réponse d'erreur : arrêter (réessayer plus tard) ou marquer à corriger. */
const Outcome = { stop: "stop", reject: "reject" } as const
type Outcome = (typeof Outcome)[keyof typeof Outcome]

function outcomeOf(error: unknown): Outcome {
  if (!(error instanceof ApiError)) return Outcome.stop
  if (error.code === ProblemCode.networkUnavailable) return Outcome.stop
  if (error.status === UNAUTHORIZED) return Outcome.stop
  if (error.status === TOO_MANY_REQUESTS || error.status >= SERVER_ERROR)
    return Outcome.stop
  return Outcome.reject
}

/**
 * Envoie la file hors ligne (D39) dès que le réseau est là : dans l'ordre de saisie, jeton
 * renouvelé d'abord. Un refus de l'API marque l'entrée « à corriger » et passe à la suivante ; une
 * coupure arrête tout jusqu'au prochain essai.
 */
export function OutboxSync() {
  const t = useTranslations("offline.sync")
  const router = useRouter()
  const { send } = useApi()
  const queryClient = useQueryClient()
  const renew = useTokenRenewal()
  const owner = useAuth().user?.profile.sub
  const organizationId = useActiveOrganization().activeOrganizationId
  const online = useOnline()
  const { pending } = useOutbox()
  const running = useRef(false)

  const drain = useCallback(async () => {
    const queue = outboxSnapshot().filter(
      (entry) =>
        entry.status === OutboxStatus.pending &&
        entry.owner === owner &&
        entry.organizationId === organizationId
    )
    if (queue.length === 0) return
    await renew()
    const sent: Sent[] = []
    const rejected: OutboxEntry[] = []
    for (const entry of queue) {
      try {
        const result = await send<Sent>({
          ...entry.request,
          organizationScoped: true,
        })
        await removeOutboxEntry(entry.id)
        sent.push(result ?? {})
      } catch (error) {
        if (outcomeOf(error) === Outcome.stop) {
          await putOutboxEntry({ ...entry, attempts: entry.attempts + 1 })
          break
        }
        const problem = error as ApiError
        const marked = {
          ...entry,
          status: OutboxStatus.rejected,
          attempts: entry.attempts + 1,
          problem: {
            code: problem.code,
            detail: problem.detail || problem.title,
          },
        }
        await putOutboxEntry(marked)
        rejected.push(marked)
      }
    }
    if (sent.length > 0) {
      await queryClient.invalidateQueries({
        queryKey: stockKeys.all(organizationId),
      })
      const number = sent.length === 1 ? sent[0].number : undefined
      toast.success(
        number ? t("sentOne", { number }) : t("sent", { count: sent.length })
      )
    }
    if (rejected.length > 0)
      toast.error(t("rejected", { count: rejected.length }), {
        action: {
          label: t("see"),
          onClick: () => router.push(Routes.vouchers),
        },
      })
  }, [owner, organizationId, renew, send, queryClient, t, router])

  const run = useCallback(async () => {
    if (running.current || !isOnline() || !owner || !organizationId) return
    running.current = true
    try {
      if ("locks" in navigator)
        await navigator.locks.request(LOCK_NAME, () => drain())
      else await drain()
    } finally {
      running.current = false
    }
  }, [drain, owner, organizationId])

  const count = pending.length
  useEffect(() => {
    if (!online || count === 0) return
    void run()
    const timer = window.setInterval(() => void run(), RETRY_MS)
    return () => window.clearInterval(timer)
  }, [online, count, run])

  return null
}
