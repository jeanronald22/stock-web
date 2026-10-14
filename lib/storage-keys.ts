/** Clés du stockage local du navigateur, préfixées pour ne jamais entrer en collision. */
export const StorageKeys = {
  /** Suivi de l'identifiant de la personne : sur un téléphone partagé, chacun retrouve son entreprise. */
  activeOrganizationPrefix: "kreskala.active-organization.",
  oidcPrefix: "kreskala.oidc.",
} as const
