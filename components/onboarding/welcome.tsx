"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useAuth } from "react-oidc-context"

import { Splash } from "@/components/app/splash"
import { StepTransition } from "@/components/motion/step-transition"
import { useStepNavigation } from "@/components/motion/use-step-navigation"
import type { Organization, User } from "@/lib/api/platform"
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
const DONE_KEY = "done"

/** Inscription (DECISIONS.md, D15) : le nom de la personne, puis sa structure. */
export function Welcome() {
  const t = useTranslations("common")
  const me = useMe()

  if (!me.data) return <Splash label={t("loading")} />
  return <WelcomeFlow user={me.data.user} />
}

/**
 * L'étape de départ est fixée une seule fois, au premier chargement du profil : le profil est
 * rechargé après chaque enregistrement, et l'étape ne doit changer que par une navigation animée.
 */
function WelcomeFlow({ user }: { user: User }) {
  const router = useRouter()
  const auth = useAuth()
  const { setActiveOrganizationId } = useActiveOrganization()
  const [stage, setStage] = useState<Stage>(() =>
    user.profileComplete ? "business" : "profile"
  )
  const navigate = useStepNavigation<Stage>(setStage)
  const exit = () => void auth.signoutRedirect()

  return (
    <StepTransition stepKey={typeof stage === "string" ? stage : DONE_KEY}>
      {stage === "profile" ? (
        <ProfileStep
          user={user}
          step={PROFILE_STEP}
          totalSteps={TOTAL_STEPS}
          onDone={() => navigate.forward("business")}
          onExit={exit}
        />
      ) : stage === "business" ? (
        <BusinessStep
          step={BUSINESS_STEP}
          totalSteps={TOTAL_STEPS}
          onBack={() => navigate.back("profile")}
          onCreated={(organization) => {
            setActiveOrganizationId(organization.id)
            navigate.forward({ created: organization })
          }}
          onExit={exit}
        />
      ) : (
        <DoneStep
          organizationName={stage.created.name}
          onContinue={() => router.replace(Routes.dashboard)}
        />
      )}
    </StepTransition>
  )
}
