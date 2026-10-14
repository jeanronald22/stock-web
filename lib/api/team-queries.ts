"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useActiveOrganization } from "@/lib/organization/active-organization"

import { useApi } from "./api-provider"
import type { AssignableRole, MembershipStatus } from "./platform"
import { platformKeys } from "./platform-queries"
import { stockKeys } from "./stock-queries"
import type { StockGrantInput } from "./stock"

/** Équipe de l'entreprise active, et rôles Stock rattachés : relus ensemble après chaque changement. */
export const teamKeys = {
  all: (organizationId: string | null) => ["team", organizationId] as const,
  team: (organizationId: string | null) =>
    [...teamKeys.all(organizationId), "members"] as const,
  grants: (organizationId: string | null) =>
    [...teamKeys.all(organizationId), "stock-grants"] as const,
  invitation: (token: string) => ["invitation", token] as const,
}

function useOrganizationId() {
  return useActiveOrganization().activeOrganizationId
}

export function useTeam() {
  const { platform } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: teamKeys.team(organizationId),
    queryFn: platform.team,
    enabled: !!organizationId,
  })
}

export function useStockGrants() {
  const { stock } = useApi()
  const organizationId = useOrganizationId()
  return useQuery({
    queryKey: teamKeys.grants(organizationId),
    queryFn: stock.grants,
    enabled: !!organizationId,
  })
}

function useTeamMutation<Input, Output>(
  mutationFn: (input: Input) => Promise<Output>
) {
  const queryClient = useQueryClient()
  const organizationId = useOrganizationId()
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: teamKeys.all(organizationId),
        }),
        // Le rôle Stock de la personne connectée a peut-être changé aussi.
        queryClient.invalidateQueries({
          queryKey: stockKeys.all(organizationId),
        }),
      ]),
  })
}

/**
 * Invitation puis accès Stock prévu pour elle (deux modules, D8). Si le second échoue,
 * l'invitation existe sans accès Stock : il se donne ensuite depuis la ligne du membre.
 */
export function useInvite() {
  const { platform, stock } = useApi()
  return useTeamMutation(
    async ({
      id,
      email,
      role,
      access,
    }: {
      id: string
      email: string
      role: AssignableRole
      access: StockGrantInput | null
    }) => {
      const sent = await platform.invite(id, email, role)
      if (access) await stock.grantInvitation(sent.invitation.id, access)
      return sent
    }
  )
}

export function useResendInvitation() {
  const { platform } = useApi()
  return useTeamMutation((id: string) => platform.resendInvitation(id))
}

export function useRevokeInvitation() {
  const { platform } = useApi()
  return useTeamMutation((id: string) => platform.revokeInvitation(id))
}

export function useChangeMemberRole() {
  const { platform } = useApi()
  return useTeamMutation(
    ({ userId, role }: { userId: string; role: AssignableRole }) =>
      platform.changeMemberRole(userId, role)
  )
}

export function useChangeMemberStatus() {
  const { platform } = useApi()
  return useTeamMutation(
    ({ userId, status }: { userId: string; status: MembershipStatus }) =>
      platform.changeMemberStatus(userId, status)
  )
}

/** Accès Stock d'un membre ; null le retire. */
export function useGrantMember() {
  const { stock } = useApi()
  return useTeamMutation(
    async ({
      subject,
      access,
    }: {
      subject: string
      access: StockGrantInput | null
    }): Promise<void> => {
      if (access) await stock.grantMember(subject, access)
      else await stock.revokeMember(subject)
    }
  )
}

export function useInvitationPreview(token: string) {
  const { platform } = useApi()
  return useQuery({
    queryKey: teamKeys.invitation(token),
    queryFn: () => platform.invitation(token),
    retry: false,
  })
}

export function useAcceptInvitation() {
  const { platform } = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (token: string) => platform.acceptInvitation(token),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: platformKeys.me }),
  })
}
