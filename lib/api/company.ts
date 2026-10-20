import { ResponseKind, type ApiClient } from "./http"

/** Routes de la fiche et du KYB de l'entreprise active (stock-api, PlatformApi ; D45). */
export const CompanyPaths = {
  company: "/v1/company",
  document: (kind: string) =>
    `/v1/company/documents/${encodeURIComponent(kind)}`,
  verification: "/v1/company/verification",
  logo: "/v1/company/logo",
} as const

/** Nom de la partie du formulaire multipart (stock-api, PlatformApi.DOCUMENT_PART). */
const DOCUMENT_PART = "file"

/** Limites propres à la fiche (stock-api, FieldLimits) ; nom, ville et secteur : celles de platform.ts. */
export const CompanyLimits = {
  phone: 30,
  address: 200,
  businessId: 40,
  /** Taille d'une pièce, en octets (5 Mo, stock-api CompanyService.MAX_SIZE). */
  documentBytes: 5 * 1024 * 1024,
} as const

/** Logo : une image (stock-api, ImageFormat), 5 Mo au plus (CompanyService.MAX_SIZE). */
export const LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

/** Formats acceptés par l'API, reconnus à leur contenu : photo ou PDF. */
export const KYB_DOCUMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const

/** Champ de l'erreur business-id-invalid : le type d'identifiant refusé (stock-api, BusinessIdInvalidException). */
export const BUSINESS_ID_TYPE_FIELD = "businessIdType"

/** Pièces du niveau 1 (D6) ; les justificatifs portent le nom de leur identifiant (RCCM, NIU). */
export const KybDocumentKind = {
  managerId: "MANAGER_ID",
  premisesPhoto: "PREMISES_PHOTO",
} as const

/**
 * Identifiants dont l'écran connaît le nom et l'exemple (Cameroun) ; un autre type du pays
 * s'affiche sous son code.
 */
export const knownBusinessIdTypes = ["RCCM", "NIU"] as const
export type KnownBusinessIdType = (typeof knownBusinessIdTypes)[number]
export const isKnownBusinessIdType = (
  type: string
): type is KnownBusinessIdType =>
  (knownBusinessIdTypes as readonly string[]).includes(type)

/** Pièces dont l'écran connaît le nom et la consigne. */
export type KnownKybDocumentKind =
  (typeof KybDocumentKind)[keyof typeof KybDocumentKind] | KnownBusinessIdType
export const isKnownKybDocumentKind = (
  kind: string
): kind is KnownKybDocumentKind =>
  kind === KybDocumentKind.managerId ||
  kind === KybDocumentKind.premisesPhoto ||
  isKnownBusinessIdType(kind)

/** Ce qui manque pour atteindre un niveau (stock-api, KybRequirement). */
export const kybRequirements = [
  "RESPONSIBLE_NAME",
  "MANAGER_ID",
  "ADDRESS_OR_PREMISES",
  "BUSINESS_IDS",
  "BUSINESS_ID_PROOFS",
] as const
export type KybRequirement = (typeof kybRequirements)[number]

export const kybStatuses = ["NONE", "PENDING", "APPROVED", "REJECTED"] as const
export type KybStatus = (typeof kybStatuses)[number]
export const KybStatus = {
  none: "NONE",
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
} as const satisfies Record<string, KybStatus>

export type KybDocument = {
  kind: string
  contentType: string
  size: number
  uploadedAt: string
}

export type Company = {
  id: string
  name: string
  countryCode: string
  city: string
  sector: string
  responsibleName: string | null
  /** Numéro international (+237…). */
  phone: string | null
  /** Indicatif du pays (+237), ajouté par l'API à un numéro saisi sans lui. */
  phonePrefix: string
  address: string | null
  /** Types d'identifiants du pays, dans l'ordre où les présenter (RCCM, NIU). */
  businessIdTypes: string[]
  businessIds: Record<string, string>
  /** Pièces que l'entreprise peut déposer : celles du niveau 1, puis un justificatif par identifiant. */
  documentKinds: string[]
  documents: KybDocument[]
  /** Lien signé vers le logo, relatif à l'API ; null sans logo. */
  logoUrl: string | null
  kyb: {
    /** 0 : inscription ; 1 : déclarée ; 2 : vérifiée par Kreskala. */
    level: number
    status: KybStatus
    requestedAt: string | null
    declarationMissing: KybRequirement[]
    verificationMissing: KybRequirement[]
  }
  version: number
}

export type CompanyInput = {
  version: number
  name: string
  city: string
  sector: string
  responsibleName: string | null
  phone: string | null
  address: string | null
  businessIds: Record<string, string>
}

export const companyApi = (send: ApiClient) => {
  const scoped = { organizationScoped: true } as const
  return {
    company: () =>
      send<Company>({ ...scoped, method: "GET", path: CompanyPaths.company }),
    update: (input: CompanyInput) =>
      send<Company>({
        ...scoped,
        method: "PUT",
        path: CompanyPaths.company,
        body: input,
      }),
    upload: (kind: string, file: Blob) => {
      const body = new FormData()
      body.append(DOCUMENT_PART, file)
      return send<Company>({
        ...scoped,
        method: "PUT",
        path: CompanyPaths.document(kind),
        body,
      })
    },
    uploadLogo: (file: Blob) => {
      const body = new FormData()
      body.append(DOCUMENT_PART, file)
      return send<Company>({
        ...scoped,
        method: "PUT",
        path: CompanyPaths.logo,
        body,
      })
    },
    removeLogo: () =>
      send<Company>({ ...scoped, method: "DELETE", path: CompanyPaths.logo }),
    remove: (kind: string) =>
      send<Company>({
        ...scoped,
        method: "DELETE",
        path: CompanyPaths.document(kind),
      }),
    /** Lue avec le jeton de connexion : chaque lecture est consignée par l'API (D6). */
    document: (kind: string) =>
      send<Blob>({
        ...scoped,
        method: "GET",
        path: CompanyPaths.document(kind),
        responseKind: ResponseKind.file,
      }),
    requestVerification: () =>
      send<Company>({
        ...scoped,
        method: "POST",
        path: CompanyPaths.verification,
      }),
  }
}
