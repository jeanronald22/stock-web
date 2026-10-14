"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

import { KreskalaLogo } from "@/components/brand/kreskala-logo"
import { InvitationScene } from "@/components/illustrations/invitation-scene"
import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/components/workspace/workspace-context"
import type { InvitationSent } from "@/lib/api/platform"
import { Routes } from "@/lib/routes"

import { InvitationLink } from "./invitation-link"

/** Fin de l'assistant : l'e-mail est parti (ou non), le lien est à partager. */
export function InvitationSentScreen({
  sent,
  onInviteAnother,
}: {
  sent: InvitationSent
  onInviteAnother: () => void
}) {
  const t = useTranslations("team")
  const router = useRouter()
  const { organization } = useWorkspace()
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-16 items-center px-4 sm:px-8">
        <KreskalaLogo className="h-8" />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <InvitationScene className="w-64" />
          <h1 className="mt-8 animate-rise-in text-3xl font-semibold tracking-tight [animation-delay:200ms]">
            {t("sent.title")}
          </h1>
          <p className="mt-3 animate-rise-in text-lg text-pretty text-muted-foreground [animation-delay:300ms]">
            {sent.emailSent
              ? t("invite.sent", { email: sent.invitation.email })
              : t("invite.notSent", { email: sent.invitation.email })}
          </p>
          {sent.link && (
            <div className="mt-8 w-full animate-rise-in text-left [animation-delay:400ms]">
              <InvitationLink
                link={sent.link}
                organizationName={organization.name}
              />
            </div>
          )}
          <Button
            size="xl"
            className="mt-8 w-full"
            onClick={() => router.push(Routes.team)}
          >
            {t("sent.backToTeam")}
          </Button>
          <Button
            size="xl"
            variant="ghost"
            className="mt-2 w-full"
            onClick={onInviteAnother}
          >
            {t("sent.inviteAnother")}
          </Button>
        </div>
      </main>
    </div>
  )
}
