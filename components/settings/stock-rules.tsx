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
import {
  useSaveStockSettings,
  useStockSettings,
} from "@/lib/api/request-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"

/**
 * Règles de travail de l'équipe (D33), réglées par le propriétaire et les administrateurs : elles
 * disent qui peut faire quoi, à côté des rôles. Chaque règle s'enregistre aussitôt.
 */
export function StockRules() {
  const t = useTranslations("settings.rules")
  const errorMessage = useErrorMessage()
  const settings = useStockSettings()
  const save = useSaveStockSettings()
  if (!settings.data) return <Skeleton className="h-32 w-full rounded-2xl" />

  return (
    <FormSection
      title={t("issueApprovalTitle")}
      description={t("issueApprovalHint")}
    >
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor="issue-approval">{t("issueApproval")}</FieldLabel>
          <FieldDescription>{t("issueApprovalWho")}</FieldDescription>
        </FieldContent>
        <Switch
          id="issue-approval"
          checked={settings.data.issueApproval}
          disabled={save.isPending}
          onCheckedChange={(issueApproval) =>
            save.mutate(
              { issueApproval },
              {
                onSuccess: () =>
                  toast.success(issueApproval ? t("enabled") : t("disabled")),
                onError: (error) => toast.error(errorMessage(error)),
              }
            )
          }
        />
      </Field>
    </FormSection>
  )
}
