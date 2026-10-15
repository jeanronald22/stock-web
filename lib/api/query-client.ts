import { QueryClient } from "@tanstack/react-query"

import { ApiError } from "./problem"

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1_000
const MAX_DELAY_MS = 15_000
const SECOND_MS = 1_000
const STALE_TIME_MS = 30_000
/** Gardées en mémoire aussi longtemps que sur le téléphone (D39), pour être relues sans réseau. */
const GC_TIME_MS = 7 * 24 * 60 * 60 * 1_000

/**
 * Seules les erreurs passagères (réseau coupé, API saturée) sont relancées, en respectant le
 * délai Retry-After de l'API. Une erreur métier (4xx) est affichée tout de suite.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  return (
    error instanceof ApiError && error.isRetryable && failureCount < MAX_RETRIES
  )
}

function retryDelay(attempt: number, error: unknown): number {
  if (error instanceof ApiError && error.retryAfterSeconds)
    return error.retryAfterSeconds * SECOND_MS
  return Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS)
}

/** Les écritures sont relançables sans risque : l'API les rend idempotentes (identifiants créés ici). */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        retryDelay,
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: shouldRetry, retryDelay },
    },
  })
}
