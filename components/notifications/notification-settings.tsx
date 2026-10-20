"use client"

import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { FormSection } from "@/components/catalog/form-section"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { SettingsLead } from "@/components/settings/settings-shell"
import {
  useChangeNotificationPreference,
  useNotificationPreferences,
} from "@/lib/api/notification-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"

/**
 * Réglages des notifications (DECISIONS.md, D26), onglet des paramètres (D45) : l'avis dans l'application reste toujours ;
 * l'e-mail se coupe type par type, enregistré aussitôt.
 */
export function NotificationSettings() {
  const t = useTranslations("notifications")
  const errorMessage = useErrorMessage()
  const preferences = useNotificationPreferences()
  const change = useChangeNotificationPreference()

  return (
    <>
      <SettingsLead>{t("settingsDescription")}</SettingsLead>
      {preferences.isPending ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : (
        (preferences.data ?? []).map((preference) => {
          const id = `email-${preference.type}`
          return (
            <FormSection
              key={preference.type}
              title={t(`types.${preference.type}.name`)}
              description={t(`types.${preference.type}.when`)}
            >
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor={id}>{t("email")}</FieldLabel>
                  <FieldDescription>{t("emailHint")}</FieldDescription>
                </FieldContent>
                <Switch
                  id={id}
                  checked={preference.emailEnabled}
                  disabled={change.isPending}
                  onCheckedChange={(emailEnabled) =>
                    change.mutate(
                      { type: preference.type, emailEnabled },
                      {
                        onSuccess: () =>
                          toast.success(
                            emailEnabled ? t("emailOn") : t("emailOff")
                          ),
                        onError: (error) => toast.error(errorMessage(error)),
                      }
                    )
                  }
                />
              </Field>
            </FormSection>
          )
        })
      )}
    </>
  )
}
