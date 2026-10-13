/** Toutes les routes de l'application : aucune adresse n'est écrite ailleurs en dur. */
export const Routes = {
  home: "/",
  signIn: "/connexion",
  signInCallback: "/auth/callback",
  welcome: "/bienvenue",
  organizations: "/entreprises",
  dashboard: "/accueil",
  runtimeConfig: "/runtime-config",
} as const

export type AppRoute = (typeof Routes)[keyof typeof Routes]
