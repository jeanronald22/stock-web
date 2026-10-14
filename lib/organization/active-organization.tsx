"use client"

import {
  createContext,
  use,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react"
import { useAuth } from "react-oidc-context"

import { StorageKeys } from "@/lib/storage-keys"

type ActiveOrganization = {
  activeOrganizationId: string | null
  setActiveOrganizationId: (id: string | null) => void
}

const ActiveOrganizationContext = createContext<ActiveOrganization | null>(null)

/** Prévient les composants abonnés quand l'entreprise active change dans cet onglet. */
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

function storageKey(subject: string): string {
  return StorageKeys.activeOrganizationPrefix + subject
}

function read(subject: string | undefined): string | null {
  if (!subject) return null
  try {
    return window.localStorage.getItem(storageKey(subject))
  } catch {
    return null
  }
}

/**
 * Entreprise choisie sur cet appareil par la personne connectée, retenue d'une ouverture à l'autre.
 * Elle est propre à chaque compte : celle d'un autre compte (téléphone partagé, changement de
 * compte) n'est jamais envoyée. L'API vérifie à chaque requête que la personne en est membre.
 */
export function ActiveOrganizationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const subject = useAuth().user?.profile.sub
  const getSnapshot = useCallback(() => read(subject), [subject])
  const activeOrganizationId = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => null
  )

  const setActiveOrganizationId = useCallback(
    (id: string | null) => {
      if (!subject) return
      try {
        if (id) window.localStorage.setItem(storageKey(subject), id)
        else window.localStorage.removeItem(storageKey(subject))
      } finally {
        listeners.forEach((listener) => listener())
      }
    },
    [subject]
  )

  const value = useMemo(
    () => ({ activeOrganizationId, setActiveOrganizationId }),
    [activeOrganizationId, setActiveOrganizationId]
  )
  return (
    <ActiveOrganizationContext value={value}>
      {children}
    </ActiveOrganizationContext>
  )
}

export function useActiveOrganization(): ActiveOrganization {
  const context = use(ActiveOrganizationContext)
  if (!context)
    throw new Error(
      "useActiveOrganization doit être utilisé sous ActiveOrganizationProvider"
    )
  return context
}
