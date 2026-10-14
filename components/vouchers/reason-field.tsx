"use client"

import { useTranslations } from "next-intl"
import { Controller, type UseFormReturn } from "react-hook-form"

import { ChoiceCard } from "@/components/team/stock-access-fields"
import { FieldError } from "@/components/ui/field"
import { voucherReasons, type VoucherType } from "@/lib/api/vouchers"

import type { VoucherFormValues } from "./voucher-form-schema"

/** Motif d'une casse ou d'un ajustement (D28) : une carte par motif, « autre » demande une note. */
export function ReasonField({
  form,
  type,
}: {
  form: UseFormReturn<VoucherFormValues>
  type: typeof VoucherType.damage | typeof VoucherType.adjustment
}) {
  const t = useTranslations("vouchers.reasons")
  return (
    <Controller
      control={form.control}
      name="reason"
      render={({ field, fieldState }) => (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t("label")}</legend>
          <div role="radiogroup" aria-label={t("label")} className="grid gap-2">
            {voucherReasons[type].map((reason) => (
              <ChoiceCard
                key={reason}
                selected={field.value === reason}
                label={t(`${reason}.label`)}
                hint={t(`${reason}.hint`)}
                onSelect={() => {
                  field.onChange(reason)
                  // La note n'est plus exigée hors « autre » : son erreur disparaît avec.
                  form.clearErrors("note")
                }}
              />
            ))}
          </div>
          <FieldError errors={[fieldState.error]} />
        </fieldset>
      )}
    />
  )
}
