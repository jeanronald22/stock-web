"use client"

import { ContactRoundIcon, MapPinIcon, PhoneIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Controller, type UseFormReturn } from "react-hook-form"

import { ChoiceCard } from "@/components/catalog/choice-card"
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
import { customerKinds } from "@/lib/api/customers"

import type { CustomerFormValues } from "./use-customer-form"

/** Genre (client ou chantier), nom et coordonnées ; seul le nom est exigé. */
export function CustomerFields({
  form,
  autoFocus,
}: {
  form: UseFormReturn<CustomerFormValues>
  autoFocus?: boolean
}) {
  const t = useTranslations()
  const errors = form.formState.errors
  const optional = (
    <span className="font-normal text-muted-foreground">
      ({t("common.optional")})
    </span>
  )
  const fields = [
    { name: "phone", icon: PhoneIcon, type: "tel", autoComplete: "tel" },
    {
      name: "address",
      icon: MapPinIcon,
      type: "text",
      autoComplete: "street-address",
    },
  ] as const

  return (
    <FieldGroup>
      <Controller
        control={form.control}
        name="kind"
        render={({ field }) => (
          <div
            role="radiogroup"
            aria-label={t("customers.form.kind")}
            className="grid grid-cols-2 gap-2"
          >
            {customerKinds.map((kind) => (
              <ChoiceCard
                key={kind}
                selected={field.value === kind}
                label={t(`customers.kinds.${kind}.label`)}
                hint={t(`customers.kinds.${kind}.hint`)}
                onSelect={() => field.onChange(kind)}
              />
            ))}
          </div>
        )}
      />
      <Field data-invalid={!!errors.name}>
        <FieldLabel htmlFor="customer-name">
          {t("customers.form.name")}
        </FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="customer-name"
            autoFocus={autoFocus}
            placeholder={t("customers.form.namePlaceholder")}
            aria-invalid={!!errors.name}
            {...form.register("name")}
          />
          <InputGroupAddon>
            <ContactRoundIcon />
          </InputGroupAddon>
        </InputGroup>
        <FieldError errors={[errors.name]} />
      </Field>
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
        {fields.map(({ name, icon: Icon, type, autoComplete }) => (
          <Field key={name} data-invalid={!!errors[name]}>
            <FieldLabel htmlFor={`customer-${name}`}>
              {t(`customers.form.${name}`)} {optional}
            </FieldLabel>
            <InputGroup>
              <InputGroupInput
                id={`customer-${name}`}
                type={type}
                autoComplete={autoComplete}
                placeholder={t(`customers.form.${name}Placeholder`)}
                aria-invalid={!!errors[name]}
                {...form.register(name)}
              />
              <InputGroupAddon>
                <Icon />
              </InputGroupAddon>
            </InputGroup>
            <FieldError errors={[errors[name]]} />
          </Field>
        ))}
      </div>
      <Field data-invalid={!!errors.note}>
        <FieldLabel htmlFor="customer-note">
          {t("customers.form.note")} {optional}
        </FieldLabel>
        <Textarea
          id="customer-note"
          rows={2}
          placeholder={t("customers.form.notePlaceholder")}
          {...form.register("note")}
        />
        <FieldError errors={[errors.note]} />
      </Field>
    </FieldGroup>
  )
}
