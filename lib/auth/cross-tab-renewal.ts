import type { UserManager } from "oidc-client-ts"

import { StorageKeys } from "@/lib/storage-keys"

const LOCK_NAME = "kreskala.token-renewal"
/** Même marge que l'alerte d'expiration d'oidc-client-ts (60 s) : en deçà, le jeton est à renouveler. */
const RENEWAL_MARGIN_SECONDS = 60

/**
 * Jeton d'accès valide pour encore un moment : renouvelé s'il expire bientôt, sous le verrou commun
 * aux onglets. Sert aussi à la file hors ligne (D39) avant de renvoyer ce qui attendait le réseau.
 */
export async function renewTokens(userManager: UserManager): Promise<void> {
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
  if ("locks" in navigator) await navigator.locks.request(LOCK_NAME, renewOnce)
  else await renewOnce()
}

/**
 * Renouvelle le jeton d'accès une seule fois pour tous les onglets ouverts : ils partagent les jetons
 * (stockage local), et Keycloak ferme la session si un même jeton de rafraîchissement est présenté
 * deux fois. Sous un verrou commun, chaque onglet relit d'abord le stockage : si un autre vient de
 * renouveler, il reprend ce jeton au lieu d'en redemander un.
 *
 * Renvoie la fonction d'arrêt.
 */
export function startCrossTabRenewal(userManager: UserManager): () => void {
  const renew = () => renewTokens(userManager)

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
