"use client"

import { SerwistProvider } from "@serwist/turbopack/react"

/** Adresse du service worker, servie par app/serwist/[path]/route.ts. */
const SW_URL = "/serwist/sw.js"

/**
 * Inscrit le service worker (D39), sauf en développement (les fichiers y changent sans cesse). Pas
 * de rechargement au retour du réseau : il ferait perdre une saisie en cours.
 */
export function ServiceWorker({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider
      swUrl={SW_URL}
      disable={process.env.NODE_ENV === "development"}
      reloadOnOnline={false}
    >
      {children}
    </SerwistProvider>
  )
}
