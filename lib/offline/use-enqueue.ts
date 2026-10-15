"use client"

import { useCallback } from "react"
import { useAuth } from "react-oidc-context"

import { ApiError, ProblemCode } from "@/lib/api/problem"
import { useActiveOrganization } from "@/lib/organization/active-organization"

import { OutboxStatus, putOutboxEntry, type OutboxEntry } from "./outbox"

/** Ce que l'écran fournit ; la file ajoute la personne, l'entreprise, l'heure et l'état. */
export type Enqueued = Pick<
  OutboxEntry,
  "id" | "kind" | "request" | "summary" | "draft"
>

/** L'envoi a échoué faute de réseau : il partira de la file (D39). */
export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof ApiError && error.code === ProblemCode.networkUnavailable
  )
}

/** Met une saisie dans la file d'envoi de la personne, pour l'entreprise active. */
export function useEnqueue() {
  const owner = useAuth().user?.profile.sub
  const organizationId = useActiveOrganization().activeOrganizationId
  return useCallback(
    async (entry: Enqueued) => {
      if (!owner || !organizationId)
        throw new Error("Session ou entreprise absente")
      await putOutboxEntry({
        ...entry,
        owner,
        organizationId,
        createdAt: new Date().toISOString(),
        status: OutboxStatus.pending,
        problem: null,
        attempts: 0,
      })
    },
    [owner, organizationId]
  )
}
