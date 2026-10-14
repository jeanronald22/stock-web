"use client"

import { MailOpenIcon, UserRoundIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import {
  FieldLimits,
  type ReceivedInvitation,
  type User,
} from "@/lib/api/platform"
import { useUpdateProfile } from "@/lib/api/platform-queries"
import { useAcceptReceivedInvitation } from "@/lib/api/team-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { useActiveOrganization } from "@/lib/organization/active-organization"
import { Routes } from "@/lib/routes"

import { OrganizationAvatar } from "./organization-avatar"

/**
 * Invitations reçues par une personne déjà inscrite (DECISIONS.md, D25) : elle rejoint l'équipe
 * d'un geste, sans retrouver l'e-mail. Son nom est demandé ici s'il manque encore.
 */
export function ReceivedInvitations({
  invitations,
  user,
}: {
  invitations: ReceivedInvitation[]
  user: User
}) {
  const t = useTranslations()
  const router = useRouter()
  const errorMessage = useErrorMessage()
  const accept = useAcceptReceivedInvitation()
  const updateProfile = useUpdateProfile()
  const { setActiveOrganizationId } = useActiveOrganization()
  const [firstName, setFirstName] = useState(user.firstName ?? "")
  const [lastName, setLastName] = useState(user.lastName ?? "")
  const [joining, setJoining] = useState<string | null>(null)
  const needsName = !user.profileComplete
  const nameMissing = needsName && (!firstName.trim() || !lastName.trim())

  const join = async (invitation: ReceivedInvitation) => {
    setJoining(invitation.id)
    try {
      if (needsName)
        await updateProfile.mutateAsync({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        })
      const organization = await accept.mutateAsync(invitation.id)
      setActiveOrganizationId(organization.id)
      toast.success(t("invitation.joined", { organization: organization.name }))
      router.replace(Routes.dashboard)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setJoining(null)
    }
  }

  return (
    <section aria-labelledby="received-invitations" className="space-y-3">
      <h2
        id="received-invitations"
        className="flex items-center gap-2 text-sm font-semibold text-primary"
      >
        <MailOpenIcon className="size-4" aria-hidden />
        {t("organizations.invitations.title", { count: invitations.length })}
      </h2>
      {needsName && (
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["firstName", firstName, setFirstName],
              ["lastName", lastName, setLastName],
            ] as const
          ).map(([field, value, setValue]) => (
            <Field key={field}>
              <FieldLabel htmlFor={`invitation-${field}`}>
                {t(`welcome.profile.${field}`)}
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id={`invitation-${field}`}
                  maxLength={FieldLimits.personName}
                  autoCapitalize="words"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                />
                <InputGroupAddon>
                  <UserRoundIcon />
                </InputGroupAddon>
              </InputGroup>
            </Field>
          ))}
        </div>
      )}
      <ul className="grid gap-3">
        {invitations.map((invitation) => (
          <li
            key={invitation.id}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4"
          >
            <OrganizationAvatar
              name={invitation.organizationName}
              className="size-12 text-base"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">
                {invitation.organizationName}
              </span>
              <span className="block text-sm text-muted-foreground">
                {invitation.inviterName
                  ? t("organizations.invitations.from", {
                      inviter: invitation.inviterName,
                      role: t(`organizations.roles.${invitation.role}`),
                    })
                  : t(`organizations.roles.${invitation.role}`)}
              </span>
            </span>
            <Button
              disabled={!!joining || nameMissing}
              onClick={() => void join(invitation)}
            >
              {joining === invitation.id && (
                <Spinner data-icon="inline-start" />
              )}
              {t("organizations.invitations.join")}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
