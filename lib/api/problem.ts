/**
 * Codes d'erreur publics de l'API (stock-api, ProblemCode). NETWORK_UNAVAILABLE est propre au
 * client : la requête n'a pas atteint l'API (réseau coupé).
 */
export const ProblemCode = {
  unauthenticated: "unauthenticated",
  accessDenied: "access-denied",
  organizationRequired: "organization-required",
  organizationIdInvalid: "organization-id-invalid",
  organizationAccessDenied: "organization-access-denied",
  validationFailed: "validation-failed",
  identityIncomplete: "identity-incomplete",
  profileConflict: "profile-conflict",
  profileIncomplete: "profile-incomplete",
  countryUnsupported: "country-unsupported",
  organizationIdConflict: "organization-id-conflict",
  organizationLimitReached: "organization-limit-reached",
  organizationNotFound: "organization-not-found",
  editConflict: "edit-conflict",
  resourceIdConflict: "resource-id-conflict",
  warehouseNotFound: "warehouse-not-found",
  warehouseNameTaken: "warehouse-name-taken",
  warehouseUnavailable: "warehouse-unavailable",
  itemNotFound: "item-not-found",
  itemReferenceTaken: "item-reference-taken",
  packagingNameDuplicate: "packaging-name-duplicate",
  packagingQuantityNotWhole: "packaging-quantity-not-whole",
  fileLinkInvalid: "file-link-invalid",
  imageUnsupported: "image-unsupported",
  imageTooLarge: "image-too-large",
  voucherLineUnavailable: "voucher-line-unavailable",
  packagingNotFound: "packaging-not-found",
  batchRequired: "batch-required",
  insufficientStock: "insufficient-stock",
  quantityNotWhole: "quantity-not-whole",
  occurredInFuture: "occurred-in-future",
  baseUnitLocked: "base-unit-locked",
  voucherNotFound: "voucher-not-found",
  supplierNotFound: "supplier-not-found",
  supplierNameTaken: "supplier-name-taken",
  supplierUnavailable: "supplier-unavailable",
  itemUnavailable: "item-unavailable",
  teamManagementDenied: "team-management-denied",
  adminRequiresOwner: "admin-requires-owner",
  memberProtected: "member-protected",
  memberNotFound: "member-not-found",
  memberAlreadyExists: "member-already-exists",
  invitationAlreadyPending: "invitation-already-pending",
  invitationNotFound: "invitation-not-found",
  invitationExpired: "invitation-expired",
  invitationEmailMismatch: "invitation-email-mismatch",
  stockAccessDenied: "stock-access-denied",
  stockWarehousesRequired: "stock-warehouses-required",
  notificationEmailUnavailable: "notification-email-unavailable",
  categoryNotFound: "category-not-found",
  categoryNameTaken: "category-name-taken",
  categoryUnavailable: "category-unavailable",
  categoryNotEmpty: "category-not-empty",
  categoryParentInvalid: "category-parent-invalid",
  serviceBusy: "service-busy",
  internalError: "internal-error",
  networkUnavailable: "network-unavailable",
} as const

export type ProblemCodeValue = (typeof ProblemCode)[keyof typeof ProblemCode]

export type FieldError = { field: string; message: string }

const UNAUTHORIZED = 401

/** Réponse d'erreur RFC 9457 de l'API, déjà traduite dans la langue de la requête. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly title: string,
    readonly detail: string,
    readonly fieldErrors: FieldError[] = [],
    readonly retryAfterSeconds?: number,
    readonly traceId?: string,
    /** Réponse complète : champs propres à certaines erreurs (« shortages »…). */
    readonly body: Record<string, unknown> = {}
  ) {
    super(detail || title)
    this.name = "ApiError"
  }

  /** Session expirée sans renouvellement possible : il faut se reconnecter. */
  get isUnauthorized(): boolean {
    return this.status === UNAUTHORIZED
  }

  /** Erreur passagère : l'action peut être relancée telle quelle. */
  get isRetryable(): boolean {
    return (
      this.code === ProblemCode.serviceBusy ||
      this.code === ProblemCode.networkUnavailable
    )
  }
}

/** Vrai si [error] est une réponse de l'API portant ce code. */
export function isProblem(
  error: unknown,
  code: ProblemCodeValue
): error is ApiError {
  return error instanceof ApiError && error.code === code
}
