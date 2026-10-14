"use client"

import { CalendarIcon, FileTextIcon, UserRoundIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { UseFormReturn } from "react-hook-form"

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
import { VoucherType, type EntryType } from "@/lib/api/vouchers"

import type { VoucherFormValues } from "./voucher-form-schema"

/**
 * Fournisseur ou client, document, date et note : tout est facultatif sauf la date. Un transfert
 * n'a ni fournisseur ni client : son autre bout est le dépôt d'arrivée.
 */
export function VoucherDetailsFields({
  form,
  type,
  today,
}: {
  form: UseFormReturn<VoucherFormValues>
  type: EntryType
  today: string
}) {
  const t = useTranslations()
  const errors = form.formState.errors
  const receipt = type === VoucherType.receipt
  const optional = (
    <span className="font-normal text-muted-foreground">
      ({t("common.optional")})
    </span>
  )

  return (
    <FieldGroup>
      {/* Réception : le fournisseur se choisit dans l'annuaire, à côté du dépôt. */}
      {type === VoucherType.issue && (
        <Field data-invalid={!!errors.counterparty}>
          <FieldLabel htmlFor="counterparty">
            {receipt
              ? t("vouchers.form.supplier")
              : t("vouchers.form.customer")}{" "}
            {optional}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="counterparty"
              placeholder={
                receipt
                  ? t("vouchers.form.supplierPlaceholder")
                  : t("vouchers.form.customerPlaceholder")
              }
              {...form.register("counterparty")}
            />
            <InputGroupAddon>
              <UserRoundIcon />
            </InputGroupAddon>
          </InputGroup>
          <FieldError errors={[errors.counterparty]} />
        </Field>
      )}
      <Field data-invalid={!!errors.documentReference}>
        <FieldLabel htmlFor="documentReference">
          {t("vouchers.form.reference")} {optional}
        </FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="documentReference"
            placeholder={t("vouchers.form.referencePlaceholder")}
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
          {t("vouchers.form.note")} {optional}
        </FieldLabel>
        <Textarea
          id="note"
          rows={2}
          placeholder={t("vouchers.form.notePlaceholder")}
          {...form.register("note")}
        />
        <FieldError errors={[errors.note]} />
      </Field>
    </FieldGroup>
  )
}
