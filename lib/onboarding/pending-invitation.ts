import { StorageKeys } from "@/lib/storage-keys"

/**
 * Jeton d'une invitation ouverte avant la connexion. Gardé sur l'appareil, pas dans l'onglet :
 * la confirmation de l'adresse d'un nouveau compte s'ouvre souvent dans un autre onglet.
 */
export function rememberPendingInvitation(token: string) {
  try {
    window.localStorage.setItem(StorageKeys.pendingInvitation, token)
  } catch {
    // Stockage indisponible (navigation privée) : la personne rouvrira le lien reçu.
  }
}

export function readPendingInvitation(): string | null {
  try {
    return window.localStorage.getItem(StorageKeys.pendingInvitation)
  } catch {
    return null
  }
}

export function forgetPendingInvitation() {
  try {
    window.localStorage.removeItem(StorageKeys.pendingInvitation)
  } catch {
    // Rien à effacer si le stockage est indisponible.
  }
}
