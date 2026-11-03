"use client"

import { useTranslations } from "next-intl"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { FormSection } from "@/components/catalog/form-section"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import {
  useSaveStockSettings,
  useStockSettings,
} from "@/lib/api/request-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { BackdateLimits } from "@/lib/vouchers/backdating"

/**
 * Règles de travail de l'équipe (D33, D50), réglées par le propriétaire et les administrateurs :
 * elles disent qui peut faire quoi, à côté des rôles. Chaque règle s'enregistre à part.
 */
export function StockRules() {
  const t = useTranslations("settings.rules")
  const errorMessage = useErrorMessage()
  const settings = useStockSettings()
  const save = useSaveStockSettings()
  if (!settings.data) return <Skeleton className="h-32 w-full rounded-2xl" />

  return (
    <>
      <FormSection
        title={t("issueApprovalTitle")}
        description={t("issueApprovalHint")}
      >
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="issue-approval">
              {t("issueApproval")}
            </FieldLabel>
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
      <FormSection title={t("backdateTitle")} description={t("backdateHint")}>
        {/* Relu ailleurs entre-temps : le champ repart de la valeur enregistrée. */}
        <BackdateField
          key={settings.data.backdateDays}
          saved={settings.data.backdateDays}
        />
      </FormSection>
    </>
  )
}

/** Nombre de jours d'antidatage permis (D50) : saisi, puis enregistré d'un geste. */
function BackdateField({ saved }: { saved: number }) {
  const t = useTranslations("settings.rules")
  const errorMessage = useErrorMessage()
  const save = useSaveStockSettings()
  const [text, setText] = useState(String(saved))
  const value = /^\d+$/.test(text.trim()) ? Number(text.trim()) : null
  const invalid =
    value === null || value < BackdateLimits.min || value > BackdateLimits.max

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (invalid || value === saved) return
    save.mutate(
      { backdateDays: value },
      {
        onSuccess: () => toast.success(t("backdateSaved", { days: value })),
        onError: (error) => toast.error(errorMessage(error)),
      }
    )
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <Field data-invalid={invalid} className="max-w-xs">
        <FieldLabel htmlFor="backdate-days">{t("backdateLabel")}</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="backdate-days"
            inputMode="numeric"
            value={text}
            aria-invalid={invalid}
            onChange={(event) => setText(event.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>{t("backdateUnit")}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>{t("backdateWho")}</FieldDescription>
        <FieldError
          errors={[
            invalid
              ? {
                  message: t("backdateInvalid", {
                    min: BackdateLimits.min,
                    max: BackdateLimits.max,
                  }),
                }
              : undefined,
          ]}
        />
      </Field>
      <Button
        type="submit"
        variant="outline"
        disabled={invalid || value === saved || save.isPending}
      >
        {save.isPending && <Spinner data-icon="inline-start" />}
        {t("backdateSave")}
      </Button>
    </form>
  )
}
