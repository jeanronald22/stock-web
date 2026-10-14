import type { Me } from "@/lib/api/platform"
import { Routes, type AppRoute } from "@/lib/routes"

export type HomeDecision = {
  route: AppRoute
  /** Entreprise à activer avant d'y aller, quand le choix est évident. */
  activate?: string
}

/**
 * Écran d'arrivée après la connexion (DECISIONS.md, D15) : inscription à terminer, entreprise
 * déjà choisie sur cet appareil, entreprise unique, ou choix parmi plusieurs.
 */
export function resolveHome(
  me: Me,
  activeOrganizationId: string | null
): HomeDecision {
  if (!me.user.profileComplete || me.organizations.length === 0) {
    return { route: Routes.welcome }
  }
  if (
    me.organizations.some(
      (organization) => organization.id === activeOrganizationId
    )
  ) {
    return { route: Routes.dashboard }
  }
  if (me.organizations.length === 1) {
    return { route: Routes.dashboard, activate: me.organizations[0].id }
  }
  return { route: Routes.organizations }
}
