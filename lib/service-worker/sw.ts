/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker"
import {
  NetworkOnly,
  Serwist,
  type PrecacheEntry,
  type SerwistGlobalConfig,
} from "serwist"

/**
 * Service worker (D39) : les fichiers de l'application sont gardés à l'installation, les pages au
 * fil des visites ; une page jamais ouverte sans réseau affiche l'écran « hors ligne ». Les appels
 * à l'API (autre origine) ne passent jamais par ce cache : les lectures hors ligne ont le leur,
 * propre à la personne connectée.
 */

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

/** Page affichée à la place d'une page jamais ouverte, sans réseau. */
const OFFLINE_PAGE = "/hors-ligne"
const DOCUMENT = "document"

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.origin !== self.location.origin,
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: OFFLINE_PAGE,
        matcher: ({ request }) => request.destination === DOCUMENT,
      },
    ],
  },
})

serwist.addEventListeners()
