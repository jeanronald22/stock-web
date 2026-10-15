"use client"

import { createContext, use, useEffect, useState } from "react"

import {
  publicConfigSchema,
  type PublicConfig,
} from "@/lib/config/public-config"
import { Routes } from "@/lib/routes"
import { StorageKeys } from "@/lib/storage-keys"

const RuntimeConfigContext = createContext<PublicConfig | null>(null)

function storeConfig(config: PublicConfig) {
  try {
    localStorage.setItem(StorageKeys.runtimeConfig, JSON.stringify(config))
  } catch {
    // Stockage indisponible : seul le démarrage hors ligne en pâtit.
  }
}

function storedConfig(): PublicConfig | null {
  try {
    const raw = localStorage.getItem(StorageKeys.runtimeConfig)
    return raw ? publicConfigSchema.parse(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function useRuntimeConfig(): PublicConfig {
  const config = use(RuntimeConfigContext)
  if (!config)
    throw new Error(
      "useRuntimeConfig doit être utilisé sous RuntimeConfigProvider"
    )
  return config
}

type State =
  | { status: "loading" }
  | { status: "ready"; config: PublicConfig }
  | { status: "failed" }

export function RuntimeConfigProvider({
  children,
  loading,
  failed,
}: {
  children: React.ReactNode
  loading: React.ReactNode
  failed: (retry: () => void) => React.ReactNode
}) {
  const [state, setState] = useState<State>({ status: "loading" })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch(Routes.runtimeConfig)
      .then((response) =>
        response.ok ? response.json() : Promise.reject(response.status)
      )
      .then((json) => publicConfigSchema.parse(json))
      .then((config) => {
        storeConfig(config)
        if (!cancelled) setState({ status: "ready", config })
      })
      .catch(() => {
        // Sans réseau, la dernière configuration reçue suffit pour redémarrer (D39).
        const stored = storedConfig()
        if (!cancelled)
          setState(
            stored ? { status: "ready", config: stored } : { status: "failed" }
          )
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  if (state.status === "loading") return loading
  if (state.status === "failed") {
    return failed(() => {
      setState({ status: "loading" })
      setAttempt((value) => value + 1)
    })
  }
  return (
    <RuntimeConfigContext value={state.config}>{children}</RuntimeConfigContext>
  )
}
