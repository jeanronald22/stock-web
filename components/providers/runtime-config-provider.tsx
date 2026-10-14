"use client"

import { createContext, use, useEffect, useState } from "react"

import {
  publicConfigSchema,
  type PublicConfig,
} from "@/lib/config/public-config"
import { Routes } from "@/lib/routes"

const RuntimeConfigContext = createContext<PublicConfig | null>(null)

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
      .then((config) => !cancelled && setState({ status: "ready", config }))
      .catch(() => !cancelled && setState({ status: "failed" }))
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
