import type { AuthContextProps } from "react-oidc-context"

import { StorageKeys } from "@/lib/storage-keys"

/**
 * Actions de compte confiées à Keycloak (« application initiated actions », D46), puis retour à
 * l'application. Avec le jeton hors ligne, Keycloak ne garde pas de session : il redemande toujours
 * le mot de passe actuel d'abord. Le mot de passe ne passe jamais par l'API de Kreskala.
 */
export const AccountAction = { updatePassword: "UPDATE_PASSWORD" } as const
export type AccountAction = (typeof AccountAction)[keyof typeof AccountAction]

/** Issue renvoyée par Keycloak dans l'adresse de retour. */
export const AccountActionStatus = {
  success: "success",
  cancelled: "cancelled",
  error: "error",
} as const
export type AccountActionStatus =
  (typeof AccountActionStatus)[keyof typeof AccountActionStatus]

const KC_ACTION = "kc_action"
const KC_ACTION_STATUS = "kc_action_status"

type PendingAction = {
  action: AccountAction
  /** Écran d'où l'action est partie : on y revient. */
  returnTo: string
  status?: AccountActionStatus
}

const isStatus = (value: string | null): value is AccountActionStatus =>
  Object.values<string | null>(AccountActionStatus).includes(value)

function read(): PendingAction | null {
  try {
    const raw = window.sessionStorage.getItem(StorageKeys.accountAction)
    return raw ? (JSON.parse(raw) as PendingAction) : null
  } catch {
    return null
  }
}

function write(pending: PendingAction | null) {
  try {
    if (pending)
      window.sessionStorage.setItem(
        StorageKeys.accountAction,
        JSON.stringify(pending)
      )
    else window.sessionStorage.removeItem(StorageKeys.accountAction)
  } catch {
    // Stockage indisponible (navigation privée) : on reviendra à l'accueil, sans message.
  }
}

export function startAccountAction(
  auth: AuthContextProps,
  action: AccountAction,
  returnTo: string,
  locale: string,
  /** Adresse pré-remplie sur l'écran de connexion qui précède l'action. */
  loginHint: string | undefined
) {
  write({ action, returnTo })
  return auth.signinRedirect({
    login_hint: loginHint,
    ui_locales: locale,
    extraQueryParams: { [KC_ACTION]: action },
  })
}

/** Au retour de Keycloak, avant que l'adresse ne soit nettoyée : retient l'issue de l'action. */
export function recordAccountActionStatus() {
  const pending = read()
  if (!pending) return
  const status = new URLSearchParams(window.location.search).get(
    KC_ACTION_STATUS
  )
  write({ ...pending, status: isStatus(status) ? status : undefined })
}

/** Écran où revenir après une action de compte, s'il y en a une en cours. */
export function accountActionReturn(): string | null {
  return read()?.returnTo ?? null
}

/** L'issue de l'action, lue une seule fois par l'écran d'où elle est partie. */
export function takeAccountActionResult(): PendingAction | null {
  const pending = read()
  write(null)
  return pending
}
