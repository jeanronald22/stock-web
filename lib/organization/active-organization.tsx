"use client"

import { createContext, use, useCallback, useMemo, useSyncExternalStore } from "react"

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

function read(): string | null {
  try {
    return window.localStorage.getItem(StorageKeys.activeOrganization)
  } catch {
    return null
  }
}

/**
 * Entreprise choisie sur cet appareil, retenue d'une ouverture à l'autre. Elle est envoyée à
 * l'API, qui vérifie à chaque requête que la personne en est toujours membre.
 */
export function ActiveOrganizationProvider({ children }: { children: React.ReactNode }) {
  const activeOrganizationId = useSyncExternalStore(subscribe, read, () => null)

  const setActiveOrganizationId = useCallback((id: string | null) => {
    try {
      if (id) window.localStorage.setItem(StorageKeys.activeOrganization, id)
      else window.localStorage.removeItem(StorageKeys.activeOrganization)
    } finally {
      listeners.forEach((listener) => listener())
    }
  }, [])

  const value = useMemo(
    () => ({ activeOrganizationId, setActiveOrganizationId }),
    [activeOrganizationId, setActiveOrganizationId]
  )
  return <ActiveOrganizationContext value={value}>{children}</ActiveOrganizationContext>
}

export function useActiveOrganization(): ActiveOrganization {
  const context = use(ActiveOrganizationContext)
  if (!context) throw new Error("useActiveOrganization doit être utilisé sous ActiveOrganizationProvider")
  return context
}
