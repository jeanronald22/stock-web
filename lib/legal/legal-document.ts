/**
 * Document juridique (politique de confidentialité, puis conditions d'utilisation) : du contenu
 * structuré, rendu par LegalDocument. Les textes vivent dans content/legal, une version par langue.
 */
export type LegalBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: readonly string[] }

export type LegalSection<Id extends string = string> = {
  /** Ancre stable, identique dans toutes les langues : les liens vers une section restent valables. */
  id: Id
  title: string
  blocks: readonly LegalBlock[]
}

export type LegalDocumentContent<Id extends string = string> = {
  title: string
  summary: string
  updatedOnLabel: string
  versionLabel: string
  contentsLabel: string
  sections: readonly LegalSection<Id>[]
}

/**
 * Jetons remplacés à l'affichage : l'adresse de contact n'est écrite qu'une fois (LegalContacts).
 * « Écrivez-nous à {contact}. » devient un lien de messagerie.
 */
export const LegalTokens = {
  contact: "{contact}",
} as const

export const LegalContacts = {
  // À confirmer avant l'ouverture : la boîte doit exister et être relevée (DECISIONS.md, D18).
  privacy: "confidentialite@kreskala.com",
} as const
