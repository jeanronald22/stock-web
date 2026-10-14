import { WebStorageStateStore, type UserManagerSettings } from "oidc-client-ts"

import type { PublicConfig } from "@/lib/config/public-config"
import { Routes } from "@/lib/routes"
import { StorageKeys } from "@/lib/storage-keys"

/** offline_access : jeton de rafraîchissement longue durée, pour travailler plusieurs jours sans réseau. */
const SCOPES = ["openid", "offline_access"].join(" ")
const AUTHORIZATION_CODE = "code"
const REALMS_PATH = "realms"

export function userManagerSettings(
  config: PublicConfig,
  origin: string,
  locale: string
): UserManagerSettings {
  return {
    authority: `${config.keycloakUrl}/${REALMS_PATH}/${config.keycloakRealm}`,
    client_id: config.keycloakClientId,
    redirect_uri: origin + Routes.signInCallback,
    post_logout_redirect_uri: origin + Routes.home,
    response_type: AUTHORIZATION_CODE,
    scope: SCOPES,
    // Conservés après fermeture de l'application, comme l'exige le travail hors ligne. Contrepartie :
    // une faille XSS pourrait les lire ; la politique de sécurité du contenu (CSP) devra l'empêcher.
    userStore: new WebStorageStateStore({
      store: window.localStorage,
      prefix: StorageKeys.oidcPrefix,
    }),
    // Le renouvellement est coordonné entre les onglets (cross-tab-renewal.ts) : Keycloak n'accepte
    // chaque jeton de rafraîchissement qu'une fois et ferme la session s'il est présenté deux fois.
    automaticSilentRenew: false,
    // Les écrans de connexion s'affichent dans la langue de l'application.
    extraQueryParams: { ui_locales: locale },
  }
}

/** Retire le code et l'état de l'adresse après le retour de Keycloak. */
export function clearSigninParams() {
  window.history.replaceState({}, document.title, window.location.pathname)
}
