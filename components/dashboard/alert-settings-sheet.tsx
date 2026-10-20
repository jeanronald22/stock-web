"use client"

import { SlidersHorizontalIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { notificationIcons } from "@/components/notifications/notification-content"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { useStockAccess } from "@/components/workspace/stock-access"
import { useWorkspace } from "@/components/workspace/workspace-context"
import { useAlertSettings, useSaveAlertSettings } from "@/lib/api/alert-queries"
import {
  alertRules,
  type AlertRule,
  type AlertSettings,
} from "@/lib/api/alerts"
import { NotificationType } from "@/lib/api/notifications"
import { MembershipRole } from "@/lib/api/platform"
import { StockRole } from "@/lib/api/stock"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { Routes } from "@/lib/routes"

/** L'avis que chaque règle envoie : son nom et son icône sont ceux des notifications. */
const RULE_NOTIFICATIONS: Record<AlertRule, NotificationType> = {
  forecastDays: NotificationType.runningOut,
  dormantDays: NotificationType.dormantStock,
  damagePercent: NotificationType.abnormalDamage,
  supplierGapPercent: NotificationType.unreliableSupplier,
  expiryDays: NotificationType.expiringBatches,
}

const OverstockIcon = notificationIcons[NotificationType.overstock]

/** Mêmes droits que l'API : le propriétaire, les administrateurs et les gérants (D44). */
export function useCanSetAlerts() {
  const { organization } = useWorkspace()
  const { access } = useStockAccess()
  return (
    organization.role !== MembershipRole.member ||
    access.role === StockRole.generalManager
  )
}

/**
 * Réglage des alertes paramétrables (D44), depuis le tableau de bord qui les montre : chaque règle
 * s'allume ou se coupe, avec sa valeur. Le surstock se règle sur les fiches articles.
 */
export function AlertSettingsSheet() {
  const t = useTranslations("dashboard.alertSettings")
  const [open, setOpen] = useState(false)
  const settings = useAlertSettings(open)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm" className="h-8 rounded-full" />
        }
      >
        <SlidersHorizontalIcon />
        {t("open")}
      </SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>
        {settings.data ? (
          <AlertSettingsForm
            settings={settings.data}
            onSaved={() => setOpen(false)}
          />
        ) : (
          <div className="space-y-3 p-4" aria-hidden>
            {alertRules.map(({ rule }) => (
              <Skeleton key={rule} className="h-28 rounded-xl" />
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

/** Valeur saisie d'une règle ; coupée, elle garde sa valeur pour être rallumée. */
type RuleValue = { on: boolean; text: string }

function AlertSettingsForm({
  settings,
  onSaved,
}: {
  settings: AlertSettings
  onSaved: () => void
}) {
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
    ) as AlertSettings
    save.mutate(next, {
      onSuccess: () => {
        toast.success(t("dashboard.alertSettings.saved"))
        onSaved()
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {alertRules.map((rule) => {
          const type = RULE_NOTIFICATIONS[rule.rule]
          const Icon = notificationIcons[type]
          const value = values[rule.rule]
          const id = `alert-${rule.rule}`
          const error =
            submitted && value.on && valueOf(rule) === null
              ? t("dashboard.alertSettings.between", {
                  min: rule.min,
                  max: rule.max,
                })
              : undefined
          return (
            <section
              key={rule.rule}
              aria-labelledby={`${id}-name`}
              className="rounded-xl border p-4"
            >
              <div className="flex items-center gap-3">
                <Icon
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <h3 id={`${id}-name`} className="flex-1 text-sm font-medium">
                  {t(`notifications.types.${type}.name`)}
                </h3>
                <Switch
                  checked={value.on}
                  aria-labelledby={`${id}-name`}
                  onCheckedChange={(on) => change(rule.rule, { on })}
                />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(`dashboard.alertSettings.rules.${rule.rule}`)}
              </p>
              {value.on && (
                <div className="mt-3 w-40">
                  <InputGroup className="h-9">
                    <InputGroupInput
                      id={id}
                      inputMode="numeric"
                      value={value.text}
                      aria-invalid={!!error}
                      aria-labelledby={`${id}-name`}
                      onChange={(event) =>
                        change(rule.rule, { text: event.target.value })
                      }
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText>
                        {t(`dashboard.alertSettings.units.${rule.unit}`)}
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldError
                    errors={[error ? { message: error } : undefined]}
                  />
                </div>
              )}
            </section>
          )
        })}
        <section className="rounded-xl border border-dashed p-4">
          <div className="flex items-center gap-3">
            <OverstockIcon
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <h3 className="text-sm font-medium">
              {t(`notifications.types.${NotificationType.overstock}.name`)}
            </h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard.alertSettings.overstock")}
          </p>
        </section>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.alertSettings.email")}{" "}
          <Link
            href={Routes.notificationSettings}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {t("dashboard.alertSettings.emailLink")}
          </Link>
        </p>
      </div>
      <SheetFooter className="border-t">
        <Button type="submit" size="lg" disabled={save.isPending}>
          {save.isPending && <Spinner />}
          {t("dashboard.alertSettings.save")}
        </Button>
      </SheetFooter>
    </form>
  )
}
