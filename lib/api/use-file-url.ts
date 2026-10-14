"use client"

import { useCallback } from "react"

import { useRuntimeConfig } from "@/components/providers/runtime-config-provider"

/** Les liens de fichiers renvoyés par l'API lui sont relatifs (« /v1/files/… ») : adresse complète. */
export function useFileUrl() {
  const { apiUrl } = useRuntimeConfig()
  return useCallback(
    (url: string | null) => (url ? new URL(url, apiUrl).toString() : null),
    [apiUrl]
  )
}
