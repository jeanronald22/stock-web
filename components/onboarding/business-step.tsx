"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { MapPinIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldLimits, type Organization } from "@/lib/api/platform"
import { useCreateOrganization } from "@/lib/api/platform-queries"
import { applyServerErrors } from "@/lib/forms/apply-server-errors"
import { citySuggestions, defaultCountry, sectorCodes } from "@/lib/onboarding/catalog"

import { StepShell } from "./step-shell"
import { useErrorMessage } from "@/lib/api/use-error-message"

const FORM_ID = "welcome-business"
const CITY_LIST_ID = "welcome-city-suggestions"
const FIELDS = ["name", "city", "sector"] as const

export function BusinessStep({
  step,
  totalSteps,
  onBack,
  onCreated,
  onExit,
}: {
  step: number
  totalSteps: number
  onBack?: () => void
  onCreated: (organization: Organization) => void
  onExit: () => void
}) {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const createOrganization = useCreateOrganization()
  // Créé une seule fois : un nouvel envoi après une coupure réseau ne crée pas de doublon.
  const [organizationId] = useState(() => crypto.randomUUID())

  const text = (max: number) =>
    z.string().trim().min(1, t("validation.required")).max(max, t("validation.tooLong", { max }))
  const form = useForm({
    resolver: zodResolver(
      z.object({
        name: text(FieldLimits.organizationName),
        city: text(FieldLimits.city),
        sector: z.enum(sectorCodes, { error: t("validation.required") }),
      })
    ),
    defaultValues: { name: "", city: "", sector: undefined },
  })

  const submit = form.handleSubmit((values) =>
    createOrganization.mutate(
      { id: organizationId, countryCode: defaultCountry, ...values },
      {
        onSuccess: onCreated,
        onError: (error) => {
          if (!applyServerErrors(error, FIELDS, form.setError)) toast.error(errorMessage(error))
        },
      }
    )
  )

  const sectorItems = sectorCodes.map((code) => ({ value: code, label: t(`welcome.sectors.${code}`) }))

  return (
    <StepShell
      step={step}
      totalSteps={totalSteps}
      eyebrow={t("welcome.business.eyebrow")}
      title={t("welcome.business.title")}
      description={t("welcome.business.description")}
      formId={FORM_ID}
      submitLabel={t("welcome.submit")}
      submitting={createOrganization.isPending}
      onBack={onBack}
      onExit={onExit}
    >
      <form id={FORM_ID} onSubmit={submit} noValidate>
        <FieldGroup>
          <Field data-invalid={!!form.formState.errors.name}>
            <FieldLabel htmlFor="name">{t("welcome.business.name")}</FieldLabel>
            <Input
              id="name"
              autoComplete="organization"
              autoFocus
              placeholder={t("welcome.business.namePlaceholder")}
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
            <Field data-invalid={!!form.formState.errors.city}>
              <FieldLabel htmlFor="city">{t("welcome.business.city")}</FieldLabel>
              <Input
                id="city"
                autoComplete="address-level2"
                list={CITY_LIST_ID}
                placeholder={t("welcome.business.cityPlaceholder")}
                aria-invalid={!!form.formState.errors.city}
                {...form.register("city")}
              />
              <datalist id={CITY_LIST_ID}>
                {citySuggestions[defaultCountry].map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
              <FieldError errors={[form.formState.errors.city]} />
            </Field>

            <Field data-invalid={!!form.formState.errors.sector}>
              <FieldLabel htmlFor="sector">{t("welcome.business.sector")}</FieldLabel>
              <Controller
                control={form.control}
                name="sector"
                render={({ field, fieldState }) => (
                  <Select items={sectorItems} value={field.value ?? null} onValueChange={(value) => field.onChange(value)}>
                    <SelectTrigger id="sector" className="w-full" aria-invalid={fieldState.invalid} onBlur={field.onBlur}>
                      <SelectValue placeholder={t("welcome.business.sectorPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {sectorItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[form.formState.errors.sector]} />
            </Field>
          </div>

          <Field>
            <FieldLabel>{t("welcome.business.country")}</FieldLabel>
            <div className="flex h-11 items-center gap-2 rounded-lg border bg-muted/40 px-3.5 text-base">
              <MapPinIcon className="size-4 text-muted-foreground" aria-hidden />
              {t(`welcome.countries.${defaultCountry}`)}
            </div>
            <FieldDescription>{t("welcome.business.countryHint")}</FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </StepShell>
  )
}
