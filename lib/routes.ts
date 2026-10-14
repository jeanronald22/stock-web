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
  vouchers: "/bons",
  newReceipt: "/bons/reception",
  newIssue: "/bons/sortie",
  newTransfer: "/bons/transfert",
  stock: "/stock",
  suppliers: "/fournisseurs",
  newSupplier: "/fournisseurs/nouveau",
  team: "/equipe",
  notificationSettings: "/notifications",
  newInvitation: "/equipe/inviter",
  /** Lien reçu par e-mail ; même chemin que l'API (stock-api, TeamService.INVITATION_PATH). */
  invitation: "/invitation",
  /** Publique : ouverte depuis les écrans de connexion (Keycloak), avant toute connexion. */
  privacy: "/confidentialite",
  runtimeConfig: "/runtime-config",
} as const

export type AppRoute = (typeof Routes)[keyof typeof Routes]

/** Fiches : adresse construite à partir de l'identifiant. */
export const RecordRoutes = {
  item: (id: string) => `${Routes.items}/${id}`,
  warehouse: (id: string) => `${Routes.warehouses}/${id}`,
  voucher: (id: string) => `${Routes.vouchers}/${id}`,
  /** Réception d'un transfert au dépôt d'arrivée (D27). */
  transferReceipt: (id: string) => `${Routes.vouchers}/${id}/receptionner`,
  supplier: (id: string) => `${Routes.suppliers}/${id}`,
  member: (userId: string) => `${Routes.team}/${userId}`,
  invitation: (token: string) =>
    `${Routes.invitation}/${encodeURIComponent(token)}`,
} as const

/** Filtres des listes conservés dans l'adresse : un lien partagé ouvre la même vue. */
export const ListQueryParams = {
  /** Répétable : plusieurs dépôts. */
  warehouse: "depot",
  search: "q",
  page: "page",
  size: "lignes",
  status: "statut",
  voucherType: "type",
  category: "categorie",
  supplier: "fournisseur",
  stockAlert: "alerte",
  from: "du",
  to: "au",
  order: "ordre",
} as const

/** Valeurs de « alerte » : articles en alerte, au seuil ou en rupture. */
export const StockAlertParam = {
  any: "toutes",
  low: "bas",
  out: "rupture",
} as const
export type StockAlertParam =
  (typeof StockAlertParam)[keyof typeof StockAlertParam]

/** Valeur de « ordre » pour les bons les plus anciens d'abord ; absente, les plus récents d'abord. */
export const OLDEST_FIRST_PARAM = "anciens"

/** Valeur de « statut » pour les fiches archivées ; absente, la liste montre les fiches actives. */
export const ARCHIVED_STATUS_PARAM = "archives"

/** Paramètre d'adresse des pages publiques : langue imposée par le lien (écrans de connexion). */
export const PublicQueryParams = {
  lang: "lang",
} as const
