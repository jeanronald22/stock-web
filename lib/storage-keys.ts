/** Clés du stockage local du navigateur, préfixées pour ne jamais entrer en collision. */
export const StorageKeys = {
  /** Suivi de l'identifiant de la personne : sur un téléphone partagé, chacun retrouve son entreprise. */
  activeOrganizationPrefix: "kreskala.active-organization.",
  oidcPrefix: "kreskala.oidc.",
  /** Visites guidées déjà vues, par personne : chacune ne s'ouvre seule qu'une fois. */
  toursSeenPrefix: "kreskala.tours-seen.",
  /** Dernier dépôt d'une saisie de bon, par personne et par entreprise : déjà choisi la fois suivante. */
  lastWarehousePrefix: "kreskala.last-warehouse.",
} as const
