import type { ApiClient } from "./http"

/** Routes du module Plateforme de l'API (stock-api, PlatformApi). */
export const PlatformPaths = {
  me: "/v1/me",
  meProfile: "/v1/me/profile",
  organizations: "/v1/organizations",
} as const

export type MembershipRole = "OWNER" | "ADMIN" | "MEMBER"

export type Organization = {
  id: string
  name: string
  countryCode: string
  city: string
  sector: string
  role: MembershipRole
  kybLevel: number
}

export type User = {
  id: string
  phone: string
  firstName: string | null
  lastName: string | null
  locale: string
  profileComplete: boolean
}

export type Me = { user: User; organizations: Organization[] }

export type ProfileInput = { firstName: string; lastName: string }

export type NewOrganization = {
  id: string
  name: string
  countryCode: string
  city: string
  sector: string
}

/** Mêmes limites que l'API (stock-api, FieldLimits), pour signaler l'erreur avant l'envoi. */
export const FieldLimits = {
  personName: 100,
  organizationName: 120,
  city: 80,
  sector: 80,
} as const

export const platformApi = (send: ApiClient) => ({
  me: () => send<Me>({ method: "GET", path: PlatformPaths.me }),
  updateProfile: (input: ProfileInput) =>
    send<User>({ method: "PUT", path: PlatformPaths.meProfile, body: input }),
  createOrganization: (input: NewOrganization) =>
    send<Organization>({ method: "POST", path: PlatformPaths.organizations, body: input }),
})
