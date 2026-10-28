import type { FetchStatus } from "@tanstack/react-query"

const PAUSED: FetchStatus = "paused"

/**
 * Lecture sans réponse ni rien de gardé sur le téléphone, mise en pause faute de réseau (D39) :
 * elle reprendra d'elle-même à son retour. L'écran le dit au lieu d'afficher un chargement sans fin.
 */
export function waitsForNetwork(query: {
  isPending: boolean
  fetchStatus: FetchStatus
}): boolean {
  return query.isPending && query.fetchStatus === PAUSED
}
