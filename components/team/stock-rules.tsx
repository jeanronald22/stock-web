"use client"

import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import {
  useSaveStockSettings,
  useStockSettings,
} from "@/lib/api/request-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"

/**
 * Règles de travail de l'équipe (D33), réglées par le propriétaire et les administrateurs : elles
 * disent qui peut faire quoi, à côté des rôles.
 */
export function StockRules() {
  const t = useTranslations("team.rules")
  const errorMessage = useErrorMessage()
  const settings = useStockSettings()
  const save = useSaveStockSettings()
  if (!settings.data) return null

  return (
    <section className="mt-10" aria-labelledby="stock-rules-title">
      <h2 id="stock-rules-title" className="mb-3 text-lg font-semibold">
        {t("title")}
      </h2>
      <Field orientation="horizontal" className="rounded-2xl border p-5">
        <FieldContent>
          <FieldLabel htmlFor="issue-approval">{t("issueApproval")}</FieldLabel>
          <FieldDescription>{t("issueApprovalHint")}</FieldDescription>
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
    </section>
  )
}
