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
/** La racine redirige vers le tableau de bord côté serveur : sans réseau, on l'ouvre directement. */
const ROOT = "/"
const DASHBOARD = "/accueil"
/** Paramètre des requêtes de navigation de Next.js (contenu des écrans, pas une page HTML). */
const NEXT_RSC_PARAM = "_rsc"

const serwist: Serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // Une page gardée sert quels que soient ses paramètres : une fiche se lit dans l'adresse
  // (« /articles/fiche?id=… »), et une liste filtrée s'ouvre sans réseau comme la liste. Sauf les
  // requêtes de navigation de Next.js : elles attendent le contenu de l'écran, pas la page HTML.
  precacheOptions: {
    ignoreURLParametersMatching: [new RegExp(`^(?!${NEXT_RSC_PARAM}$)`)],
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.origin !== self.location.origin,
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ request, url }) =>
        request.destination === DOCUMENT && url.pathname === ROOT,
      handler: async ({ request }): Promise<Response> => {
        try {
          return await fetch(request)
        } catch {
          return (await serwist.matchPrecache(DASHBOARD)) ?? Response.error()
        }
      },
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
