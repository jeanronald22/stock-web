"use client"

import {
  CircleAlertIcon,
  LinkIcon,
  MailCheckIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState, type FormEvent } from "react"
import { useAuth } from "react-oidc-context"
import { toast } from "sonner"

import { FullPageMessage } from "@/components/app/full-page-message"
import { Splash } from "@/components/app/splash"
import { KreskalaLogo } from "@/components/brand/kreskala-logo"
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
  InvitationState,
  type InvitationPreview,
  type User,
} from "@/lib/api/platform"
import { useMe, useUpdateProfile } from "@/lib/api/platform-queries"
import {
  useAcceptInvitation,
  useInvitationPreview,
} from "@/lib/api/team-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import {
  forgetPendingInvitation,
  rememberPendingInvitation,
} from "@/lib/onboarding/pending-invitation"
import { useActiveOrganization } from "@/lib/organization/active-organization"
import { Routes } from "@/lib/routes"

/** Écran de création de compte de Keycloak (OpenID Connect, prompt=create). */
const CREATE_ACCOUNT_PROMPT = "create"

/**
 * Lien reçu par la personne invitée (DECISIONS.md, D25) : qui l'invite et où, puis connexion ou
 * création de compte avec l'adresse invitée, et enfin l'entrée dans l'entreprise.
 */
export function InvitationScreen({ token }: { token: string }) {
  const t = useTranslations("invitation")
  const auth = useAuth()
  const preview = useInvitationPreview(token)

  if (preview.isPending || auth.isLoading)
    return <Splash label={t("loading")} />
  if (!preview.data) {
    return (
      <FullPageMessage
        icon={LinkIcon}
        title={t("invalid.title")}
        description={t("invalid.description")}
      />
    )
  }
  const invitation = preview.data
  if (invitation.state !== InvitationState.pending) {
    return (
      <FullPageMessage
        icon={CircleAlertIcon}
        title={t(`state.${invitation.state}.title`)}
        description={t(`state.${invitation.state}.description`, {
          organization: invitation.organizationName,
        })}
        action={{
          label: t("goHome"),
          onClick: () => {
            forgetPendingInvitation()
            window.location.assign(Routes.home)
          },
        }}
      />
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background px-4 sm:px-8">
      <header className="flex h-16 items-center">
        <KreskalaLogo className="h-8" />
      </header>
      <main className="flex flex-1 items-center justify-center pb-16">
        <div className="w-full max-w-sm">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <UsersIcon className="size-6 text-primary" aria-hidden />
          </span>
          <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight text-balance">
            {invitation.inviterName
              ? t("title", {
                  inviter: invitation.inviterName,
                  organization: invitation.organizationName,
                })
              : t("titleAnonymous", {
                  organization: invitation.organizationName,
                })}
          </h1>
          <p className="mt-2 text-center text-pretty text-muted-foreground">
            {t("sentTo", { email: invitation.email })}
          </p>
          <div className="mt-8">
            {auth.isAuthenticated ? (
              <SignedIn token={token} invitation={invitation} />
            ) : (
              <SignedOut token={token} email={invitation.email} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function SignedOut({ token, email }: { token: string; email: string }) {
  const t = useTranslations("invitation")
  const auth = useAuth()
  const signIn = (create: boolean) => {
    rememberPendingInvitation(token)
    void auth.signinRedirect({
      login_hint: email,
      prompt: create ? CREATE_ACCOUNT_PROMPT : undefined,
    })
  }
  return (
    <div className="space-y-3">
      <Button size="xl" className="w-full" onClick={() => signIn(true)}>
        {t("createAccount")}
      </Button>
      <Button
        size="xl"
        variant="outline"
        className="w-full"
        onClick={() => signIn(false)}
      >
        {t("signIn")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {t("sameEmail", { email })}
      </p>
    </div>
  )
}

function SignedIn({
  token,
  invitation,
}: {
  token: string
  invitation: InvitationPreview
}) {
  const t = useTranslations("invitation")
  const auth = useAuth()
  const me = useMe()

  if (!me.data) return <Spinner className="mx-auto" />
  if (me.data.user.email?.toLowerCase() !== invitation.email) {
    return (
      <div className="space-y-4 rounded-xl border p-4 text-sm">
        <p>
          {t("otherAccount", {
            current: me.data.user.email ?? "",
            email: invitation.email,
          })}
        </p>
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          onClick={() => {
            rememberPendingInvitation(token)
            void auth.signoutRedirect()
          }}
        >
          {t("switchAccount")}
        </Button>
      </div>
    )
  }
  return <Accept token={token} invitation={invitation} user={me.data.user} />
}

/** Le nom est demandé ici s'il manque : il signe les bons que la personne validera. */
function Accept({
  token,
  invitation,
  user,
}: {
  token: string
  invitation: InvitationPreview
  user: User
}) {
  const t = useTranslations()
  const router = useRouter()
  const errorMessage = useErrorMessage()
  const accept = useAcceptInvitation()
  const updateProfile = useUpdateProfile()
  const { setActiveOrganizationId } = useActiveOrganization()
  const [firstName, setFirstName] = useState(user.firstName ?? "")
  const [lastName, setLastName] = useState(user.lastName ?? "")
  const needsName = !user.profileComplete
  const pending = accept.isPending || updateProfile.isPending

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      if (needsName)
        await updateProfile.mutateAsync({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        })
      const organization = await accept.mutateAsync(token)
      forgetPendingInvitation()
      setActiveOrganizationId(organization.id)
      toast.success(t("invitation.joined", { organization: organization.name }))
      router.replace(Routes.dashboard)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      {needsName && (
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["firstName", firstName, setFirstName],
              ["lastName", lastName, setLastName],
            ] as const
          ).map(([field, value, setValue]) => (
            <Field key={field}>
              <FieldLabel htmlFor={field}>
                {t(`welcome.profile.${field}`)}
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id={field}
                  required
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
      <Button
        type="submit"
        size="xl"
        className="w-full"
        disabled={
          pending || (needsName && (!firstName.trim() || !lastName.trim()))
        }
      >
        {pending ? <Spinner data-icon="inline-start" /> : <MailCheckIcon />}
        {t("invitation.join", { organization: invitation.organizationName })}
      </Button>
    </form>
  )
}
