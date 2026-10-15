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
  /** Import du catalogue depuis un fichier (D36). */
  importItems: "/articles/importer",
  /** Étiquettes à imprimer (D36) ; préremplies par LabelQueryParams. */
  labels: "/articles/etiquettes",
  warehouses: "/depots",
  newWarehouse: "/depots/nouveau",
  vouchers: "/bons",
  newReceipt: "/bons/reception",
  newIssue: "/bons/sortie",
  newTransfer: "/bons/transfert",
  newDamage: "/bons/casse",
  newAdjustment: "/bons/ajustement",
  /** Demandes de sortie à valider (D33), onglet de « Bons ». */
  requests: "/bons/demandes",
  /** Retours (D31) ; depuis un bon : ?origine=<id du bon>. */
  newCustomerReturn: "/bons/retour-client",
  newSupplierReturn: "/bons/retour-fournisseur",
  stock: "/stock",
  suppliers: "/fournisseurs",
  newSupplier: "/fournisseurs/nouveau",
  /** Clients et chantiers : second onglet de « Contacts » (D30). */
  customers: "/clients",
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
  /** Modification de la fiche ; la fiche elle-même se consulte. */
  itemEdit: (id: string) => `${Routes.items}/${id}/modifier`,
  warehouse: (id: string) => `${Routes.warehouses}/${id}`,
  warehouseEdit: (id: string) => `${Routes.warehouses}/${id}/modifier`,
  voucher: (id: string) => `${Routes.vouchers}/${id}`,
  /** Réception d'un transfert au dépôt d'arrivée (D27). */
  transferReceipt: (id: string) => `${Routes.vouchers}/${id}/receptionner`,
  supplier: (id: string) => `${Routes.suppliers}/${id}`,
  supplierEdit: (id: string) => `${Routes.suppliers}/${id}/modifier`,
  customer: (id: string) => `${Routes.customers}/${id}`,
  customerEdit: (id: string) => `${Routes.customers}/${id}/modifier`,
  request: (id: string) => `${Routes.requests}/${id}`,
  /** Inventaire d'un dépôt (D32), ouvert depuis « Stock ». */
  inventory: (id: string) => `${Routes.stock}/inventaires/${id}`,
  member: (userId: string) => `${Routes.team}/${userId}`,
  invitation: (token: string) =>
    `${Routes.invitation}/${encodeURIComponent(token)}`,
} as const

/** Paramètres d'adresse des écrans de saisie. */
export const EntryQueryParams = {
  /** Retour : le bon dont il part. */
  origin: "origine",
  /** Refaire une demande refusée ou retirée (D33) : ses lignes sont reprises. */
  fromRequest: "demande",
  /** Nouvel article depuis un code-barres inconnu (D34). */
  barcode: "codebarres",
  /** Bon commencé depuis la fiche d'un article : il est déjà sur le bon. */
  item: "article",
  /** Bon commencé depuis la fiche d'un dépôt, d'un fournisseur ou d'un client. */
  warehouse: "depot",
  supplier: "fournisseur",
  customer: "client",
} as const

/** Étiquettes préremplies : des articles (identifiants séparés par des virgules), ou un bon reçu. */
export const LabelQueryParams = {
  items: "articles",
  voucher: "bon",
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
  customer: "client",
  /** Bons qui portent cet article. */
  item: "article",
  /** Clients ou chantiers seulement (voir CustomerKindParam). */
  customerKind: "genre",
  stockAlert: "alerte",
  from: "du",
  to: "au",
  order: "ordre",
  /** Liste (par défaut) ou grille (GRID_VIEW_PARAM) : articles et stock. */
  view: "vue",
} as const

/** Valeur de « vue » pour l'affichage en grille ; absente, la liste. */
export const GRID_VIEW_PARAM = "grille"

/** Valeurs de « alerte » : articles en alerte, au seuil ou en rupture. */
export const StockAlertParam = {
  any: "toutes",
  low: "bas",
  out: "rupture",
} as const
export type StockAlertParam =
  (typeof StockAlertParam)[keyof typeof StockAlertParam]

/** Valeurs de « genre » dans la liste des clients. */
export const CustomerKindParam = {
  customers: "clients",
  sites: "chantiers",
} as const
export type CustomerKindParam =
  (typeof CustomerKindParam)[keyof typeof CustomerKindParam]

/** Valeur de « ordre » pour les bons les plus anciens d'abord ; absente, les plus récents d'abord. */
export const OLDEST_FIRST_PARAM = "anciens"

/** Valeur de « statut » pour les fiches archivées ; absente, la liste montre les fiches actives. */
export const ARCHIVED_STATUS_PARAM = "archives"

/** Paramètre d'adresse des pages publiques : langue imposée par le lien (écrans de connexion). */
export const PublicQueryParams = {
  lang: "lang",
} as const
