/** Toutes les routes de l'application : aucune adresse n'est écrite ailleurs en dur. */
export const Routes = {
  home: "/",
  signIn: "/connexion",
  signInCallback: "/auth/callback",
  welcome: "/bienvenue",
  organizations: "/entreprises",
  dashboard: "/accueil",
  items: "/articles",
  newItem: "/articles/nouveau",
  warehouses: "/depots",
  newWarehouse: "/depots/nouveau",
  /** Publique : ouverte depuis les écrans de connexion (Keycloak), avant toute connexion. */
  privacy: "/confidentialite",
  runtimeConfig: "/runtime-config",
} as const

export type AppRoute = (typeof Routes)[keyof typeof Routes]

/** Fiches : adresse construite à partir de l'identifiant. */
export const RecordRoutes = {
  item: (id: string) => `${Routes.items}/${id}`,
  warehouse: (id: string) => `${Routes.warehouses}/${id}`,
} as const

/** Filtres des listes conservés dans l'adresse : un lien partagé ouvre la même vue. */
export const ListQueryParams = {
  warehouse: "depot",
  search: "q",
  page: "page",
  size: "lignes",
  status: "statut",
} as const

/** Valeur de « statut » pour les fiches archivées ; absente, la liste montre les fiches actives. */
export const ARCHIVED_STATUS_PARAM = "archives"

/** Paramètre d'adresse des pages publiques : langue imposée par le lien (écrans de connexion). */
export const PublicQueryParams = {
  lang: "lang",
} as const
