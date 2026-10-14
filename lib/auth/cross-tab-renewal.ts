import type { UserManager } from "oidc-client-ts"

import { StorageKeys } from "@/lib/storage-keys"

const LOCK_NAME = "kreskala.token-renewal"
/** Même marge que l'alerte d'expiration d'oidc-client-ts (60 s) : en deçà, le jeton est à renouveler. */
const RENEWAL_MARGIN_SECONDS = 60

/**
 * Renouvelle le jeton d'accès une seule fois pour tous les onglets ouverts : ils partagent les jetons
 * (stockage local), et Keycloak ferme la session si un même jeton de rafraîchissement est présenté
 * deux fois. Sous un verrou commun, chaque onglet relit d'abord le stockage : si un autre vient de
 * renouveler, il reprend ce jeton au lieu d'en redemander un.
 *
 * Renvoie la fonction d'arrêt.
 */
export function startCrossTabRenewal(userManager: UserManager): () => void {
  async function renewOnce() {
    const stored = await userManager.getUser()
    if (stored && (stored.expires_in ?? 0) > RENEWAL_MARGIN_SECONDS) {
      await userManager.events.load(stored)
      return
    }
    try {
      await userManager.signinSilent()
    } catch {
      // Hors ligne ou session terminée : l'API répondra 401 et l'application renverra vers la connexion.
    }
  }

  const renew = () =>
    "locks" in navigator
      ? navigator.locks.request(LOCK_NAME, renewOnce)
      : renewOnce()

  // Un autre onglet a renouvelé les jetons ou s'est déconnecté : cet onglet s'aligne.
  const onStorage = (event: StorageEvent) => {
    if (!event.key?.startsWith(StorageKeys.oidcPrefix)) return
    void userManager
      .getUser()
      .then((user) =>
        user ? userManager.events.load(user) : userManager.events.unload()
      )
  }

  const stopExpiring = userManager.events.addAccessTokenExpiring(
    () => void renew()
  )
  window.addEventListener("storage", onStorage)
  return () => {
    stopExpiring()
    window.removeEventListener("storage", onStorage)
  }
}
