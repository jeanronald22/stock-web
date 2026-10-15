import { createStore, del, entries, set } from "idb-keyval"

import type { HttpMethod } from "@/lib/api/http"

/**
 * File d'envoi hors ligne (D39) : ce qui a été saisi sans réseau, gardé sur le téléphone (IndexedDB)
 * jusqu'à ce que l'API l'accepte. Chaque entrée porte l'identifiant de ce qu'elle crée : la renvoyer
 * ne crée jamais de doublon.
 */

export const OutboxKind = {
  voucher: "voucher",
  request: "request",
  transferReceipt: "transferReceipt",
} as const
export type OutboxKind = (typeof OutboxKind)[keyof typeof OutboxKind]

export const OutboxStatus = {
  /** Attend le réseau, ou est en cours d'envoi. */
  pending: "pending",
  /** L'API l'a refusée : à reprendre ou à supprimer. */
  rejected: "rejected",
} as const
export type OutboxStatus = (typeof OutboxStatus)[keyof typeof OutboxStatus]

export type OutboxEntry = {
  /** Identifiant de ce qui sera créé (bon, demande, réception de transfert). */
  id: string
  organizationId: string
  /** Personne qui l'a saisie (sujet Keycloak) : un téléphone partagé ne mélange pas les files. */
  owner: string
  kind: OutboxKind
  /** Heure de la saisie (ISO). */
  createdAt: string
  request: { method: HttpMethod; path: string; body: unknown }
  /** Ce que la liste « À envoyer » affiche. */
  summary: {
    voucherType: string
    warehouseName: string
    lineCount: number
    counterparty: string | null
  }
  /** De quoi reprendre la saisie si l'API refuse (valeurs du formulaire). */
  draft: unknown
  status: OutboxStatus
  problem: { code: string; detail: string } | null
  attempts: number
}

const DATABASE = "kreskala-outbox"
const TABLE = "entries"
const CHANNEL = "kreskala-outbox"

type Listener = () => void

/** Entrées de toutes les entreprises et personnes, triées par heure de saisie. */
let cache: OutboxEntry[] = []
let loaded = false
let loading: Promise<void> | null = null
const listeners = new Set<Listener>()
let channel: BroadcastChannel | null = null
let idb: ReturnType<typeof createStore> | null = null

function database() {
  idb ??= createStore(DATABASE, TABLE)
  return idb
}

function notify(broadcast: boolean) {
  listeners.forEach((listener) => listener())
  // Un autre onglet ouvert sur la même file la relit.
  if (broadcast) channel?.postMessage(null)
}

async function reload() {
  const rows = await entries<string, OutboxEntry>(database())
  cache = rows
    .map(([, entry]) => entry)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  loaded = true
}

/** Lit la file une fois ; les changements faits ailleurs (autre onglet) la font relire. */
export function loadOutbox(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (!channel && "BroadcastChannel" in window) {
    channel = new BroadcastChannel(CHANNEL)
    channel.onmessage = () => void reload().then(() => notify(false))
  }
  loading ??= reload()
    .then(() => notify(false))
    .catch(() => {
      // IndexedDB indisponible (navigation privée stricte) : la file reste vide, en mémoire.
      loaded = true
    })
  return loading
}

export function subscribeOutbox(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function outboxSnapshot(): OutboxEntry[] {
  return cache
}

export function isOutboxLoaded(): boolean {
  return loaded
}

export async function putOutboxEntry(entry: OutboxEntry): Promise<void> {
  await set(entry.id, entry, database())
  cache = [...cache.filter((other) => other.id !== entry.id), entry].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt)
  )
  notify(true)
}

export async function removeOutboxEntry(id: string): Promise<void> {
  await del(id, database())
  cache = cache.filter((entry) => entry.id !== id)
  notify(true)
}
