import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client"
import { createStore, del, get, set } from "idb-keyval"

/**
 * Lectures gardées sur le téléphone (D39) : l'application rouvre sans réseau sur ce qui a déjà été
 * vu. Une seule entrée IndexedDB, réécrite au plus une fois par seconde.
 */

const DATABASE = "kreskala-cache"
const TABLE = "queries"
const KEY = "query-client"
const WRITE_DELAY_MS = 1_000

/** Lectures gardées sept jours au plus : au-delà, elles tromperaient plus qu'elles n'aideraient. */
export const PERSISTED_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000
/**
 * À changer quand la forme des réponses de l'API change : les lectures gardées (et le catalogue
 * copié) sont alors oubliées. 2026-10-20 : photos d'un article (images), référence toujours là.
 */
export const PERSISTED_CACHE_VERSION = "2026-10-20"

let idb: ReturnType<typeof createStore> | null = null
const database = () => (idb ??= createStore(DATABASE, TABLE))

export function createQueryPersister(): Persister {
  let timer: ReturnType<typeof setTimeout> | null = null
  let latest: PersistedClient | null = null
  return {
    persistClient: (client) => {
      latest = client
      if (timer) return
      timer = setTimeout(() => {
        timer = null
        if (latest) void set(KEY, latest, database()).catch(() => undefined)
      }, WRITE_DELAY_MS)
    },
    restoreClient: () =>
      get<PersistedClient>(KEY, database()).catch(() => undefined),
    removeClient: () => clearPersistedQueries(),
  }
}

/** À la déconnexion : rien de l'entreprise ne reste lisible sur le téléphone. */
export async function clearPersistedQueries(): Promise<void> {
  await del(KEY, database()).catch(() => undefined)
}
