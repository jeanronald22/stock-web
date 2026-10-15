"use client"

import { useEffect, useSyncExternalStore } from "react"

import { useActiveOrganization } from "@/lib/organization/active-organization"

import { catalogOf, loadCatalog, subscribeCatalog } from "./offline-catalog"

/** Catalogue de l'entreprise active gardé sur le téléphone ; vide tant qu'il n'a pas été copié. */
export function useOfflineCatalog() {
  const organizationId = useActiveOrganization().activeOrganizationId
  useEffect(() => {
    if (organizationId) void loadCatalog(organizationId)
  }, [organizationId])
  return useSyncExternalStore(
    subscribeCatalog,
    () => (organizationId ? catalogOf(organizationId) : undefined),
    () => undefined
  )
}
