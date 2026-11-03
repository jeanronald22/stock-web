"use client"

import { CalendarIcon, FileTextIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useWatch, type UseFormReturn } from "react-hook-form"

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import {
  correctionTypes,
  OTHER_REASON,
  type EntryType,
} from "@/lib/api/vouchers"

import type { VoucherFormValues } from "./voucher-form-schema"

/**
 * Document, date et note : tout est facultatif sauf la date (et la note d'une correction au motif
 * « autre »). Le fournisseur ou le client se choisit dans l'annuaire, à côté du dépôt.
 */
export function VoucherDetailsFields({
  form,
  type,
  today,
  earliest,
  noteRequired: required = false,
}: {
  form: UseFormReturn<VoucherFormValues>
  type: EntryType
  today: string
  /** Premier jour permis (D50) ; undefined sans limite. */
  earliest: string | undefined
  /** Retour sans bon d'origine (D50) : la note en donne la raison. */
  noteRequired?: boolean
}) {
  const t = useTranslations()
  const errors = form.formState.errors
  const reason = useWatch({ control: form.control, name: "reason" })
  // Casse ou ajustement « autre » : la note dit ce qui s'est passé.
  const noteRequired =
    required || (correctionTypes.has(type) && reason === OTHER_REASON)
  const optional = (
    <span className="font-normal text-muted-foreground">
      ({t("common.optional")})
    </span>
  )

  return (
    <FieldGroup>
      <Field data-invalid={!!errors.documentReference}>
        <FieldLabel htmlFor="documentReference">
          {t("vouchers.form.reference")} {optional}
        </FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="documentReference"
            placeholder={
              correctionTypes.has(type)
                ? t("vouchers.form.correctionReferencePlaceholder")
                : t("vouchers.form.referencePlaceholder")
            }
            {...form.register("documentReference")}
          />
          <InputGroupAddon>
            <FileTextIcon />
          </InputGroupAddon>
        </InputGroup>
        <FieldError errors={[errors.documentReference]} />
      </Field>
      <Field data-invalid={!!errors.occurredOn}>
        <FieldLabel htmlFor="occurredOn">{t("vouchers.form.date")}</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="occurredOn"
            type="date"
            min={earliest}
            max={today}
            {...form.register("occurredOn")}
          />
          <InputGroupAddon>
            <CalendarIcon />
          </InputGroupAddon>
        </InputGroup>
        <FieldError errors={[errors.occurredOn]} />
      </Field>
      <Field data-invalid={!!errors.note}>
        <FieldLabel htmlFor="note">
          {t("vouchers.form.note")} {!noteRequired && optional}
        </FieldLabel>
        <Textarea
          id="note"
          rows={2}
          aria-invalid={!!errors.note}
          placeholder={
            required
              ? t("vouchers.returns.notePlaceholder")
              : noteRequired
                ? t("vouchers.form.noteRequiredPlaceholder")
                : t("vouchers.form.notePlaceholder")
          }
          {...form.register("note")}
        />
        <FieldError errors={[errors.note]} />
      </Field>
    </FieldGroup>
  )
}
