import type { ApiClient } from "./http"

/** Routes du module Plateforme de l'API (stock-api, PlatformApi). */
export const PlatformPaths = {
  me: "/v1/me",
  meProfile: "/v1/me/profile",
  organizations: "/v1/organizations",
  team: "/v1/team",
  teamInvitations: "/v1/team/invitations",
  teamInvitation: (id: string) => `/v1/team/invitations/${id}`,
  teamInvitationResend: (id: string) => `/v1/team/invitations/${id}/resend`,
  teamMember: (userId: string) => `/v1/team/members/${userId}`,
  teamMemberDisable: (userId: string) => `/v1/team/members/${userId}/disable`,
  teamMemberEnable: (userId: string) => `/v1/team/members/${userId}/enable`,
  invitation: (token: string) => `/v1/invitations/${encodeURIComponent(token)}`,
  invitationAccept: (token: string) =>
    `/v1/invitations/${encodeURIComponent(token)}/accept`,
} as const

export const membershipRoles = ["OWNER", "ADMIN", "MEMBER"] as const
export type MembershipRole = (typeof membershipRoles)[number]
export const MembershipRole = {
  owner: "OWNER",
  admin: "ADMIN",
  member: "MEMBER",
} as const satisfies Record<string, MembershipRole>

/** Rôles qu'une invitation ou un changement de rôle peut donner (stock-api, AssignableRole). */
export const assignableRoles = [
  MembershipRole.member,
  MembershipRole.admin,
] as const
export type AssignableRole = (typeof assignableRoles)[number]

export type MembershipStatus = "ACTIVE" | "DISABLED"
export const MembershipStatus = {
  active: "ACTIVE",
  disabled: "DISABLED",
} as const satisfies Record<string, MembershipStatus>

export type InvitationState = "PENDING" | "EXPIRED" | "ACCEPTED" | "REVOKED"
export const InvitationState = {
  pending: "PENDING",
  expired: "EXPIRED",
  accepted: "ACCEPTED",
  revoked: "REVOKED",
} as const satisfies Record<string, InvitationState>

export type TeamMember = {
  userId: string
  /** Identifiant Keycloak : celui des rôles Stock. */
  subject: string
  firstName: string | null
  lastName: string | null
  email: string | null
  role: MembershipRole
  status: MembershipStatus
  joinedAt: string
  self: boolean
}

export type Invitation = {
  id: string
  email: string
  role: MembershipRole
  state: InvitationState
  invitedByName: string | null
  createdAt: string
  expiresAt: string
}

export type Team = { members: TeamMember[]; invitations: Invitation[] }

/** [link] : seulement à l'envoi (null si la création avait déjà eu lieu). */
export type InvitationSent = {
  invitation: Invitation
  link: string | null
  emailSent: boolean
}

export type InvitationPreview = {
  organizationName: string
  inviterName: string | null
  email: string
  role: MembershipRole
  state: InvitationState
  expiresAt: string
}

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
  email: string | null
  phone: string | null
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
  email: 254,
} as const

export const platformApi = (send: ApiClient) => ({
  team: () =>
    send<Team>({
      organizationScoped: true,
      method: "GET",
      path: PlatformPaths.team,
    }),
  invite: (id: string, email: string, role: AssignableRole) =>
    send<InvitationSent>({
      organizationScoped: true,
      method: "POST",
      path: PlatformPaths.teamInvitations,
      body: { id, email, role },
    }),
  resendInvitation: (id: string) =>
    send<InvitationSent>({
      organizationScoped: true,
      method: "POST",
      path: PlatformPaths.teamInvitationResend(id),
    }),
  revokeInvitation: (id: string) =>
    send<void>({
      organizationScoped: true,
      method: "DELETE",
      path: PlatformPaths.teamInvitation(id),
    }),
  changeMemberRole: (userId: string, role: AssignableRole) =>
    send<void>({
      organizationScoped: true,
      method: "PUT",
      path: PlatformPaths.teamMember(userId),
      body: { role },
    }),
  changeMemberStatus: (userId: string, status: MembershipStatus) =>
    send<void>({
      organizationScoped: true,
      method: "POST",
      path:
        status === MembershipStatus.disabled
          ? PlatformPaths.teamMemberDisable(userId)
          : PlatformPaths.teamMemberEnable(userId),
    }),
  /** Public : la personne invitée n'est peut-être pas encore connectée. */
  invitation: (token: string) =>
    send<InvitationPreview>({
      method: "GET",
      path: PlatformPaths.invitation(token),
    }),
  acceptInvitation: (token: string) =>
    send<Organization>({
      method: "POST",
      path: PlatformPaths.invitationAccept(token),
    }),
  me: () => send<Me>({ method: "GET", path: PlatformPaths.me }),
  updateProfile: (input: ProfileInput) =>
    send<User>({ method: "PUT", path: PlatformPaths.meProfile, body: input }),
  createOrganization: (input: NewOrganization) =>
    send<Organization>({
      method: "POST",
      path: PlatformPaths.organizations,
      body: input,
    }),
})
