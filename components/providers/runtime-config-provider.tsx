"use client"

import {
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"

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

/** Configuration gardée telle qu'écrite : une chaîne, que React compare d'un rendu à l'autre. */
function storedRaw(): string | null {
  try {
    return localStorage.getItem(StorageKeys.runtimeConfig)
  } catch {
    return null
  }
}

function parseConfig(raw: string | null): PublicConfig | null {
  try {
    return raw ? publicConfigSchema.parse(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

/** Rien ne la change de l'extérieur pendant la visite : pas d'abonnement. */
const noSubscription = () => () => {}

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
  // La dernière configuration reçue démarre l'application sans attendre le réseau, et suffit
  // hors ligne (D39). Le rendu du serveur n'a pas de stockage local : null pendant l'hydratation.
  const raw = useSyncExternalStore(noSubscription, storedRaw, () => null)
  const stored = useMemo(() => parseConfig(raw), [raw])

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
        if (!cancelled) setState({ status: "failed" })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  // Une réponse identique à la configuration gardée garde son objet : en changer recréerait la
  // connexion pour rien.
  const config =
    state.status === "ready" &&
    (!stored || JSON.stringify(stored) !== JSON.stringify(state.config))
      ? state.config
      : stored

  if (!config) {
    if (state.status === "failed")
      return failed(() => {
        setState({ status: "loading" })
        setAttempt((value) => value + 1)
      })
    return loading
  }
  return <RuntimeConfigContext value={config}>{children}</RuntimeConfigContext>
}
