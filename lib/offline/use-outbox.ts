"use client"

import { useEffect, useMemo, useSyncExternalStore } from "react"
import { useAuth } from "react-oidc-context"

import { useActiveOrganization } from "@/lib/organization/active-organization"

import {
  isOutboxLoaded,
  loadOutbox,
  OutboxStatus,
  outboxSnapshot,
  subscribeOutbox,
  type OutboxEntry,
} from "./outbox"

const EMPTY: OutboxEntry[] = []

/** File d'envoi de la personne connectée, dans l'entreprise active (D39). */
export function useOutbox() {
  const owner = useAuth().user?.profile.sub
  const organizationId = useActiveOrganization().activeOrganizationId
  useEffect(() => {
    void loadOutbox()
  }, [])
  const all = useSyncExternalStore(subscribeOutbox, outboxSnapshot, () => EMPTY)
  return useMemo(() => {
    const mine = all.filter(
      (entry) =>
        entry.owner === owner && entry.organizationId === organizationId
    )
    return {
      /** La file a été lue sur le téléphone (une reprise de saisie peut s'y chercher). */
      loaded: isOutboxLoaded(),
      entries: mine,
      pending: mine.filter((entry) => entry.status === OutboxStatus.pending),
      rejected: mine.filter((entry) => entry.status === OutboxStatus.rejected),
    }
  }, [all, owner, organizationId])
}
