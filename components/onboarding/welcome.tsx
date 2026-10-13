"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useAuth } from "react-oidc-context"

import { Splash } from "@/components/app/splash"
import type { Organization } from "@/lib/api/platform"
import { useMe } from "@/lib/api/platform-queries"
import { useActiveOrganization } from "@/lib/organization/active-organization"
import { Routes } from "@/lib/routes"

import { BusinessStep } from "./business-step"
import { DoneStep } from "./done-step"
import { ProfileStep } from "./profile-step"

type Stage = "profile" | "business" | { created: Organization }

const TOTAL_STEPS = 2
const PROFILE_STEP = 1
const BUSINESS_STEP = 2

/** Inscription (DECISIONS.md, D15) : le nom de la personne, puis sa structure. */
export function Welcome() {
  const t = useTranslations("common")
  const router = useRouter()
  const auth = useAuth()
  const me = useMe()
  const { setActiveOrganizationId } = useActiveOrganization()
  const [stage, setStage] = useState<Stage | null>(null)

  if (!me.data) return <Splash label={t("loading")} />

  const current: Stage = stage ?? (me.data.user.profileComplete ? "business" : "profile")
  const exit = () => void auth.signoutRedirect()

  if (current === "profile") {
    return (
      <ProfileStep
        user={me.data.user}
        step={PROFILE_STEP}
        totalSteps={TOTAL_STEPS}
        onDone={() => setStage("business")}
        onExit={exit}
      />
    )
  }
  if (current === "business") {
    return (
      <BusinessStep
        step={BUSINESS_STEP}
        totalSteps={TOTAL_STEPS}
        onBack={() => setStage("profile")}
        onCreated={(organization) => {
          setActiveOrganizationId(organization.id)
          setStage({ created: organization })
        }}
        onExit={exit}
      />
    )
  }
  return <DoneStep organizationName={current.created.name} onContinue={() => router.replace(Routes.dashboard)} />
}
