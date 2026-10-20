"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { FormActions, FormSection } from "@/components/catalog/form-section"
import { notificationIcons } from "@/components/notifications/notification-content"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { useAlertSettings, useSaveAlertSettings } from "@/lib/api/alert-queries"
import {
  alertRules,
  type AlertRule,
  type AlertSettings as AlertSettingsValues,
} from "@/lib/api/alerts"
import { NotificationType } from "@/lib/api/notifications"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { Routes } from "@/lib/routes"

import { SettingsLead } from "./settings-shell"

/** L'avis que chaque règle envoie : son nom et son icône sont ceux des notifications. */
const RULE_NOTIFICATIONS: Record<AlertRule, NotificationType> = {
  forecastDays: NotificationType.runningOut,
  dormantDays: NotificationType.dormantStock,
  damagePercent: NotificationType.abnormalDamage,
  supplierGapPercent: NotificationType.unreliableSupplier,
  expiryDays: NotificationType.expiringBatches,
}

/**
 * Alertes paramétrables (D44), onglet des paramètres (D45) : chaque règle s'allume ou se coupe,
 * avec sa valeur. Le surstock se règle sur les fiches articles.
 */
export function AlertSettings() {
  const t = useTranslations("settings.alerts")
  const settings = useAlertSettings(true)
  return (
    <>
      <SettingsLead>{t("description")}</SettingsLead>
      {settings.data ? (
        <AlertSettingsForm settings={settings.data} />
      ) : (
        <div className="space-y-3" aria-hidden>
          {alertRules.map(({ rule }) => (
            <Skeleton key={rule} className="h-24 rounded-2xl" />
          ))}
        </div>
      )}
    </>
  )
}

/** Valeur saisie d'une règle ; coupée, elle garde sa valeur pour être rallumée. */
type RuleValue = { on: boolean; text: string }

function AlertSettingsForm({ settings }: { settings: AlertSettingsValues }) {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const save = useSaveAlertSettings()
  const [values, setValues] = useState<Record<AlertRule, RuleValue>>(
    () =>
      Object.fromEntries(
        alertRules.map(({ rule, suggested }) => [
          rule,
          {
            on: settings[rule] !== null,
            text: String(settings[rule] ?? suggested),
          },
        ])
      ) as Record<AlertRule, RuleValue>
  )
  const [submitted, setSubmitted] = useState(false)

  /** La valeur d'une règle allumée, ou null si elle sort des bornes de l'API. */
  const valueOf = (rule: (typeof alertRules)[number]) => {
    const text = values[rule.rule].text.trim()
    const number = Number(text)
    return /^\d+$/.test(text) && number >= rule.min && number <= rule.max
      ? number
      : null
  }
  const invalid = alertRules.filter(
    (rule) => values[rule.rule].on && valueOf(rule) === null
  )

  const change = (rule: AlertRule, value: Partial<RuleValue>) =>
    setValues((current) => ({
      ...current,
      [rule]: { ...current[rule], ...value },
    }))

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (invalid.length > 0) return
    const next = Object.fromEntries(
      alertRules.map((rule) => [
        rule.rule,
        values[rule.rule].on ? valueOf(rule) : null,
      ])
    ) as AlertSettingsValues
    save.mutate(next, {
      onSuccess: () => toast.success(t("settings.alerts.saved")),
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <form onSubmit={submit} noValidate>
      {alertRules.map((rule) => {
        const type = RULE_NOTIFICATIONS[rule.rule]
        const Icon = notificationIcons[type]
        const value = values[rule.rule]
        const id = `alert-${rule.rule}`
        const error =
          submitted && value.on && valueOf(rule) === null
            ? t("settings.alerts.between", { min: rule.min, max: rule.max })
            : undefined
        const name = t(`notifications.types.${type}.name`)
        return (
          <FormSection
            key={rule.rule}
            title={name}
            description={t(`settings.alerts.rules.${rule.rule}`)}
          >
            {/* L'interrupteur porte le nom de la règle ; le texte à côté dit son état. */}
            <Field orientation="horizontal">
              <span className="flex flex-1 items-center gap-2 text-sm font-medium">
                <Icon
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                {value.on ? t("settings.alerts.on") : t("settings.alerts.off")}
              </span>
              <Switch
                checked={value.on}
                aria-label={name}
                onCheckedChange={(on) => change(rule.rule, { on })}
              />
            </Field>
            {value.on && (
              <Field className="mt-4 max-w-xs">
                <FieldLabel htmlFor={id}>
                  {t(`settings.alerts.values.${rule.rule}`)}
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id={id}
                    inputMode="numeric"
                    value={value.text}
                    aria-invalid={!!error}
                    onChange={(event) =>
                      change(rule.rule, { text: event.target.value })
                    }
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>
                      {t(`settings.alerts.units.${rule.unit}`)}
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError errors={[error ? { message: error } : undefined]} />
              </Field>
            )}
          </FormSection>
        )
      })}
      <FormSection
        title={t(`notifications.types.${NotificationType.overstock}.name`)}
        description={t("settings.alerts.overstock")}
      >
        <Link
          href={Routes.items}
          className="text-sm font-medium underline underline-offset-4"
        >
          {t("settings.alerts.overstockLink")}
        </Link>
      </FormSection>
      <FormSection
        title={t("settings.alerts.emailTitle")}
        description={t("settings.alerts.email")}
      >
        <Link
          href={Routes.notificationSettings}
          className="text-sm font-medium underline underline-offset-4"
        >
          {t("settings.alerts.emailLink")}
        </Link>
      </FormSection>
      <FormActions>
        <Button type="submit" size="lg" disabled={save.isPending}>
          {save.isPending && <Spinner />}
          {t("settings.alerts.save")}
        </Button>
      </FormActions>
    </form>
  )
}
