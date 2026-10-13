import { WebStorageStateStore } from "oidc-client-ts"
import type { AuthProviderProps } from "react-oidc-context"

import type { PublicConfig } from "@/lib/config/public-config"
import { Routes } from "@/lib/routes"
import { StorageKeys } from "@/lib/storage-keys"

/** offline_access : jeton de rafraîchissement longue durée, pour travailler plusieurs jours sans réseau. */
const SCOPES = ["openid", "offline_access"].join(" ")
const AUTHORIZATION_CODE = "code"
const REALMS_PATH = "realms"

export function oidcSettings(config: PublicConfig, origin: string, locale: string): AuthProviderProps {
  return {
    authority: `${config.keycloakUrl}/${REALMS_PATH}/${config.keycloakRealm}`,
    client_id: config.keycloakClientId,
    redirect_uri: origin + Routes.signInCallback,
    post_logout_redirect_uri: origin + Routes.home,
    response_type: AUTHORIZATION_CODE,
    scope: SCOPES,
    // Conservés après fermeture de l'application, comme l'exige le travail hors ligne. Contrepartie :
    // une faille XSS pourrait les lire ; la politique de sécurité du contenu (CSP) devra l'empêcher.
    userStore: new WebStorageStateStore({ store: window.localStorage, prefix: StorageKeys.oidcPrefix }),
    automaticSilentRenew: true,
    // Les écrans de connexion s'affichent dans la langue de l'application.
    extraQueryParams: { ui_locales: locale },
    onSigninCallback: () => window.history.replaceState({}, document.title, window.location.pathname),
  }
}
