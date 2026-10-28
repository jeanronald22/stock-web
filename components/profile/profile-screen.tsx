"use client"

import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { toast } from "sonner"

import { memberName } from "@/components/team/team-format"
import { PageBody, PageHeader } from "@/components/workspace/page-header"
import { useWorkspace } from "@/components/workspace/workspace-context"
import {
  AccountAction,
  AccountActionStatus,
  takeAccountActionResult,
} from "@/lib/auth/account-action"

import { ProfileIdentity } from "./profile-identity"
import { ProfileLanguage } from "./profile-language"
import { ProfilePassword } from "./profile-password"
import { ProfilePhoto } from "./profile-photo"

/**
 * « Mon profil » (D46), ouvert depuis le menu du compte : photo, nom, langue et mot de passe de la
 * personne connectée, quelle que soit l'entreprise active.
 */
export function ProfileScreen() {
  const t = useTranslations("profile")
  const { user } = useWorkspace()

  // Retour de Keycloak après un changement de mot de passe : on dit ce qu'il en est, une fois.
  useEffect(() => {
    const result = takeAccountActionResult()
    if (result?.action !== AccountAction.updatePassword) return
    if (result.status === AccountActionStatus.success)
      toast.success(t("password.changed"))
    else if (result.status === AccountActionStatus.error)
      toast.error(t("password.failed"))
  }, [t])

  return (
    <PageBody>
      <PageHeader
        title={t("title")}
        description={t("description")}
        className="mb-8"
      />
      <ProfilePhoto user={user} name={memberName(user)} />
      {/* Nom gardé sur le téléphone (D39) puis relu : le formulaire repart du nom à jour. */}
      <ProfileIdentity key={memberName(user)} user={user} />
      <ProfileLanguage />
      <ProfilePassword email={user.email} />
    </PageBody>
  )
}
