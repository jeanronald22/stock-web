"use client"

import { CloudOffIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect } from "react"

import { useMe } from "@/lib/api/platform-queries"
import { ApiError, ProblemCode } from "@/lib/api/problem"
import { resolveHome } from "@/lib/onboarding/resolve-home"
import { useActiveOrganization } from "@/lib/organization/active-organization"

import { FullPageMessage } from "./full-page-message"
import { Splash } from "./splash"

/** Conduit la personne connectée vers son écran d'arrivée. */
export function HomeRedirect() {
  const t = useTranslations()
  const router = useRouter()
  const me = useMe()
  const { activeOrganizationId, setActiveOrganizationId } =
    useActiveOrganization()

  useEffect(() => {
    if (!me.data) return
    const decision = resolveHome(me.data, activeOrganizationId)
    if (decision.activate) setActiveOrganizationId(decision.activate)
    router.replace(decision.route)
  }, [me.data, activeOrganizationId, setActiveOrganizationId, router])

  if (me.error) {
    const offline =
      me.error instanceof ApiError &&
      me.error.code === ProblemCode.networkUnavailable
    return (
      <FullPageMessage
        icon={CloudOffIcon}
        title={t("errors.loadTitle")}
        description={offline ? t("errors.network") : t("errors.generic")}
        action={{ label: t("common.retry"), onClick: () => void me.refetch() }}
        footnote={
          me.error instanceof ApiError && me.error.traceId
            ? t("errors.trace", { traceId: me.error.traceId })
            : undefined
        }
      />
    )
  }
  return <Splash label={t("callback.label")} />
}
