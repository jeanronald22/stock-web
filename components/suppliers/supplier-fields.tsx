"use client"

import { MailIcon, MapPinIcon, PhoneIcon, TruckIcon } from "lucide-react"
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

import type { SupplierFormValues } from "./use-supplier-form"

/** Nom et coordonnées d'un fournisseur ; seul le nom est exigé. */
export function SupplierFields({
  form,
  autoFocus,
}: {
  form: UseFormReturn<SupplierFormValues>
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
    { name: "email", icon: MailIcon, type: "email", autoComplete: "email" },
    {
      name: "address",
      icon: MapPinIcon,
      type: "text",
      autoComplete: "street-address",
    },
  ] as const

  return (
    <FieldGroup>
      <Field data-invalid={!!errors.name}>
        <FieldLabel htmlFor="name">{t("suppliers.form.name")}</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="name"
            autoFocus={autoFocus}
            placeholder={t("suppliers.form.namePlaceholder")}
            aria-invalid={!!errors.name}
            {...form.register("name")}
          />
          <InputGroupAddon>
            <TruckIcon />
          </InputGroupAddon>
        </InputGroup>
        <FieldError errors={[errors.name]} />
      </Field>
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
        {fields.map(({ name, icon: Icon, type, autoComplete }) => (
          <Field
            key={name}
            data-invalid={!!errors[name]}
            className={name === "address" ? "sm:col-span-2" : undefined}
          >
            <FieldLabel htmlFor={name}>
              {t(`suppliers.form.${name}`)} {optional}
            </FieldLabel>
            <InputGroup>
              <InputGroupInput
                id={name}
                type={type}
                autoComplete={autoComplete}
                placeholder={t(`suppliers.form.${name}Placeholder`)}
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
        <FieldLabel htmlFor="note">
          {t("suppliers.form.note")} {optional}
        </FieldLabel>
        <Textarea
          id="note"
          rows={2}
          placeholder={t("suppliers.form.notePlaceholder")}
          {...form.register("note")}
        />
        <FieldError errors={[errors.note]} />
      </Field>
    </FieldGroup>
  )
}
