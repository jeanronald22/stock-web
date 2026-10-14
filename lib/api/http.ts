import { ApiError, ProblemCode, type FieldError } from "./problem"

/** En-têtes propres à l'API (stock-api, ApiHeaders). */
export const ApiHeaders = {
  organizationId: "X-Organization-Id",
  idempotencyKey: "Idempotency-Key",
  retryAfter: "Retry-After",
} as const

/** En-têtes HTTP standard utilisés par le client. */
const StandardHeaders = {
  accept: "Accept",
  acceptLanguage: "Accept-Language",
  authorization: "Authorization",
  contentType: "Content-Type",
} as const

const PROBLEM_JSON = "application/problem+json"
const JSON_TYPE = "application/json"
const BEARER = "Bearer"
const NO_CONTENT = 204

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export type ApiRequest = {
  method: HttpMethod
  path: string
  body?: unknown
  /** Clé stable entre deux essais de la même action, pour que l'API ne la traite qu'une fois. */
  idempotencyKey?: string
  /**
   * Route métier, propre à l'entreprise active : l'en-tête X-Organization-Id est envoyé. Les routes
   * du compte (/v1/me, /v1/organizations) ne l'envoient pas : une entreprise oubliée ou retirée ne
   * doit pas empêcher la personne de retrouver son compte.
   */
  organizationScoped?: boolean
}

export type ApiClientDependencies = {
  baseUrl: string
  getAccessToken: () => string | undefined
  getLocale: () => string
  getOrganizationId: () => string | null
}

export type ApiClient = <T>(request: ApiRequest) => Promise<T>

export function createApiClient(deps: ApiClientDependencies): ApiClient {
  return async function send<T>(request: ApiRequest): Promise<T> {
    const headers = new Headers({
      [StandardHeaders.accept]: `${JSON_TYPE}, ${PROBLEM_JSON}`,
      [StandardHeaders.acceptLanguage]: deps.getLocale(),
    })
    const token = deps.getAccessToken()
    if (token) headers.set(StandardHeaders.authorization, `${BEARER} ${token}`)
    const organizationId = request.organizationScoped
      ? deps.getOrganizationId()
      : null
    if (organizationId) headers.set(ApiHeaders.organizationId, organizationId)
    if (request.idempotencyKey)
      headers.set(ApiHeaders.idempotencyKey, request.idempotencyKey)
    // Un fichier part en multipart : le navigateur fixe lui-même l'en-tête et sa frontière.
    const multipart = request.body instanceof FormData
    if (request.body !== undefined && !multipart)
      headers.set(StandardHeaders.contentType, JSON_TYPE)

    let response: Response
    try {
      response = await fetch(new URL(request.path, deps.baseUrl), {
        method: request.method,
        headers,
        body:
          request.body === undefined
            ? undefined
            : multipart
              ? (request.body as FormData)
              : JSON.stringify(request.body),
      })
    } catch {
      throw new ApiError(0, ProblemCode.networkUnavailable, "", "")
    }

    if (response.ok) {
      return (
        response.status === NO_CONTENT ? undefined : await response.json()
      ) as T
    }
    throw await toApiError(response)
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  const retryAfter =
    Number(response.headers.get(ApiHeaders.retryAfter)) || undefined
  if (
    !response.headers.get(StandardHeaders.contentType)?.includes(PROBLEM_JSON)
  ) {
    return new ApiError(
      response.status,
      ProblemCode.internalError,
      response.statusText,
      "",
      [],
      retryAfter
    )
  }
  const problem = (await response.json()) as Record<string, unknown> & {
    code?: string
    title?: string
    detail?: string
    errors?: FieldError[]
    traceId?: string
  }
  return new ApiError(
    response.status,
    problem.code ?? ProblemCode.internalError,
    problem.title ?? response.statusText,
    problem.detail ?? "",
    problem.errors ?? [],
    retryAfter,
    problem.traceId,
    problem
  )
}
