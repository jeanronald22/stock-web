import { onlineManager } from "@tanstack/react-query"

/**
 * Réseau disponible ou non (D39). Le navigateur dit s'il a une connexion ; il peut se tromper (wifi
 * sans internet) : un appel à l'API qui échoue faute de réseau compte aussi, et une sonde vérifie
 * ensuite, à intervalles réguliers, que l'API répond de nouveau.
 */

/** Intervalle de la sonde tant que l'API est injoignable. */
const PROBE_INTERVAL_MS = 15_000
/** Point de santé public de l'API (Spring Actuator). */
const HEALTH_PATH = "/actuator/health"

type Listener = () => void

let browserOnline = typeof navigator === "undefined" ? true : navigator.onLine
let apiUnreachable = false
let probeUrl: string | null = null
let probeTimer: ReturnType<typeof setInterval> | null = null
const listeners = new Set<Listener>()

function notify() {
  // TanStack Query met en pause ses lectures hors ligne et les relance au retour du réseau.
  onlineManager.setOnline(isOnline())
  listeners.forEach((listener) => listener())
}

export function isOnline(): boolean {
  return browserOnline && !apiUnreachable
}

export function subscribeConnectivity(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Un appel n'a pas pu joindre l'API : on se considère hors ligne jusqu'à preuve du contraire. */
export function reportNetworkFailure() {
  if (apiUnreachable) return
  apiUnreachable = true
  startProbe()
  notify()
}

/** L'API a répondu (même par une erreur) : le réseau est là. */
export function reportNetworkSuccess() {
  if (!apiUnreachable) return
  apiUnreachable = false
  stopProbe()
  notify()
}

function startProbe() {
  if (probeTimer || !probeUrl) return
  const url = probeUrl
  probeTimer = setInterval(() => {
    if (!browserOnline) return
    fetch(url, { cache: "no-store" })
      .then(() => reportNetworkSuccess())
      .catch(() => undefined)
  }, PROBE_INTERVAL_MS)
}

function stopProbe() {
  if (probeTimer) clearInterval(probeTimer)
  probeTimer = null
}

/**
 * Écoute le navigateur et prépare la sonde vers [apiUrl]. Renvoie la fonction d'arrêt ; un seul
 * appel par application.
 */
export function startConnectivity(apiUrl: string): () => void {
  probeUrl = new URL(HEALTH_PATH, apiUrl).toString()
  const update = () => {
    browserOnline = navigator.onLine
    // Une connexion qui revient mérite une vérification immédiate de l'API.
    if (browserOnline && apiUnreachable) {
      stopProbe()
      startProbe()
    }
    notify()
  }
  window.addEventListener("online", update)
  window.addEventListener("offline", update)
  update()
  return () => {
    window.removeEventListener("online", update)
    window.removeEventListener("offline", update)
    stopProbe()
  }
}
