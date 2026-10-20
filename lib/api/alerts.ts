import type { ApiClient } from "./http"

/** Route des alertes paramétrables (stock-api, StockApi ; D44). */
export const AlertPaths = {
  settings: "/v1/stock/settings/alerts",
} as const

/**
 * Règles des alertes de l'entreprise (D44) ; null : règle coupée. Le surstock n'a pas de réglage
 * ici : il suit le stock maximum de chaque fiche article.
 */
export type AlertSettings = {
  /** Rupture prévue : le stock tient moins de ce nombre de jours au rythme des sorties. */
  forecastDays: number | null
  /** Stock qui dort : aucune sortie depuis ce nombre de jours. */
  dormantDays: number | null
  /** Casse anormale : part de la casse dans ce qui est parti, en pourcentage. */
  damagePercent: number | null
  /** Fournisseur peu fiable : part des réceptions avec écart, en pourcentage. */
  supplierGapPercent: number | null
  /** Péremption : date limite d'un lot en stock dans ce nombre de jours. */
  expiryDays: number | null
}
export type AlertRule = keyof AlertSettings

/** Unité de la valeur d'une règle. */
export const AlertRuleUnit = { days: "days", percent: "percent" } as const
export type AlertRuleUnit = (typeof AlertRuleUnit)[keyof typeof AlertRuleUnit]

/**
 * Règles dans l'ordre de l'écran, avec les bornes de l'API (AlertSettingsRequest) et la valeur
 * proposée quand on rallume une règle (AlertSettingsView.DEFAULTS).
 */
export const alertRules: readonly {
  rule: AlertRule
  unit: AlertRuleUnit
  min: number
  max: number
  suggested: number
}[] = [
  {
    rule: "forecastDays",
    unit: AlertRuleUnit.days,
    min: 1,
    max: 365,
    suggested: 15,
  },
  {
    rule: "dormantDays",
    unit: AlertRuleUnit.days,
    min: 1,
    max: 730,
    suggested: 90,
  },
  {
    rule: "damagePercent",
    unit: AlertRuleUnit.percent,
    min: 1,
    max: 100,
    suggested: 5,
  },
  {
    rule: "supplierGapPercent",
    unit: AlertRuleUnit.percent,
    min: 1,
    max: 100,
    suggested: 20,
  },
  {
    rule: "expiryDays",
    unit: AlertRuleUnit.days,
    min: 1,
    max: 365,
    suggested: 30,
  },
]

export const alertApi = (send: ApiClient) => {
  const scoped = { organizationScoped: true } as const
  return {
    settings: () =>
      send<AlertSettings>({
        ...scoped,
        method: "GET",
        path: AlertPaths.settings,
      }),
    saveSettings: (settings: AlertSettings) =>
      send<AlertSettings>({
        ...scoped,
        method: "PUT",
        path: AlertPaths.settings,
        body: settings,
      }),
  }
}
