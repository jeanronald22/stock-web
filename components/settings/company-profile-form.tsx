"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { Controller, useForm, type Path } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { FormActions, FormSection } from "@/components/catalog/form-section"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useUpdateCompany } from "@/lib/api/company-queries"
import {
  BUSINESS_ID_TYPE_FIELD,
  CompanyLimits,
  isKnownBusinessIdType,
  type Company,
} from "@/lib/api/company"
import { FieldLimits } from "@/lib/api/platform"
import { ApiError, isProblem, ProblemCode } from "@/lib/api/problem"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { applyServerErrors } from "@/lib/forms/apply-server-errors"
import { applyProblemToField } from "@/lib/forms/problem-fields"
import { citySuggestions, sectorCodes } from "@/lib/onboarding/catalog"

import { CompanyLogo } from "./company-logo"
import { KybAnchors } from "./kyb-anchors"

const CITY_LIST_ID = "company-city-suggestions"
const FIELDS = [
  "name",
  "city",
  "sector",
  "responsibleName",
  "phone",
  "address",
] as const

type CompanyFormValues = {
  name: string
  city: string
  sector: string
  responsibleName: string
  phone: string
  address: string
  businessIds: Record<string, string>
}

const valuesOf = (company: Company): CompanyFormValues => ({
  name: company.name,
  city: company.city,
  sector: company.sector,
  responsibleName: company.responsibleName ?? "",
  phone: company.phone ?? "",
  address: company.address ?? "",
  businessIds: Object.fromEntries(
    company.businessIdTypes.map((type) => [
      type,
      company.businessIds[type] ?? "",
    ])
  ),
})

/** Champ vide : non renseigné, l'API l'efface. */
const optional = (value: string) => value.trim() || null

/**
 * Fiche de l'entreprise (D45) : son nom et son activité, le responsable, l'adresse et les
 * identifiants du pays. Le téléphone et les identifiants sont normalisés par l'API.
 */
export function CompanyProfileForm({
  company,
  onConflict,
}: {
  company: Company
  /** Fiche modifiée ailleurs entre-temps : la relire ; le formulaire repart de la fiche à jour. */
  onConflict: () => Promise<Company | undefined>
}) {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const update = useUpdateCompany()

  const text = (max: number, required: boolean) => {
    const value = z.string().trim().max(max, t("validation.tooLong", { max }))
    return required ? value.min(1, t("validation.required")) : value
  }
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(
      z.object({
        name: text(FieldLimits.organizationName, true),
        city: text(FieldLimits.city, true),
        sector: text(FieldLimits.sector, true),
        responsibleName: text(FieldLimits.personName, false),
        phone: text(CompanyLimits.phone, false),
        address: text(CompanyLimits.address, false),
        businessIds: z.record(
          z.string(),
          text(CompanyLimits.businessId, false)
        ),
      })
    ),
    defaultValues: valuesOf(company),
  })
  const errors = form.formState.errors

  // Un secteur saisi avant la liste actuelle reste proposé tel quel.
  const sectorItems = [
    ...sectorCodes.map((code) => ({
      value: code as string,
      label: t(`welcome.sectors.${code}`),
    })),
    ...(sectorCodes.some((code) => code === company.sector)
      ? []
      : [{ value: company.sector, label: company.sector }]),
  ]

  const failed = (error: unknown) => {
    if (applyServerErrors(error, FIELDS, form.setError)) return
    if (
      applyProblemToField(
        error,
        { [ProblemCode.phoneInvalid]: "phone" },
        form.setError
      )
    )
      return
    if (
      error instanceof ApiError &&
      error.code === ProblemCode.businessIdInvalid
    ) {
      const type = error.body[BUSINESS_ID_TYPE_FIELD]
      if (typeof type === "string" && company.businessIdTypes.includes(type)) {
        form.setError(
          `businessIds.${type}`,
          { type: "server", message: error.detail },
          { shouldFocus: true }
        )
        return
      }
    }
    toast.error(errorMessage(error), {
      action: isProblem(error, ProblemCode.editConflict)
        ? {
            label: t("common.reload"),
            onClick: () =>
              void onConflict().then(
                (fresh) => fresh && form.reset(valuesOf(fresh))
              ),
          }
        : undefined,
    })
  }

  const submit = form.handleSubmit((values) =>
    update.mutate(
      {
        // Dernière version connue : un dépôt de pièce l'a peut-être fait avancer depuis l'ouverture.
        version: company.version,
        name: values.name,
        city: values.city,
        sector: values.sector,
        responsibleName: optional(values.responsibleName),
        phone: optional(values.phone),
        address: optional(values.address),
        businessIds: values.businessIds,
      },
      {
        onSuccess: (saved) => {
          form.reset(valuesOf(saved))
          toast.success(t("settings.company.saved"))
        },
        onError: failed,
      }
    )
  )

  return (
    <form onSubmit={submit} noValidate>
      <FormSection
        title={t("settings.company.identity.title")}
        description={t("settings.company.identity.description")}
      >
        <FieldGroup>
          <CompanyLogo company={company} />
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="company-name">
              {t("settings.company.fields.name")}
            </FieldLabel>
            <Input
              id="company-name"
              autoComplete="organization"
              aria-invalid={!!errors.name}
              {...form.register("name")}
            />
            <FieldError errors={[errors.name]} />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
            <Field data-invalid={!!errors.sector}>
              <FieldLabel htmlFor="company-sector">
                {t("settings.company.fields.sector")}
              </FieldLabel>
              <Controller
                control={form.control}
                name="sector"
                render={({ field, fieldState }) => (
                  <Select
                    items={sectorItems}
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger
                      id="company-sector"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                      onBlur={field.onBlur}
                    >
                      <SelectValue />
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
              <FieldError errors={[errors.sector]} />
            </Field>
            <Field data-invalid={!!errors.city}>
              <FieldLabel htmlFor="company-city">
                {t("settings.company.fields.city")}
              </FieldLabel>
              <Input
                id="company-city"
                autoComplete="address-level2"
                list={CITY_LIST_ID}
                aria-invalid={!!errors.city}
                {...form.register("city")}
              />
              <datalist id={CITY_LIST_ID}>
                {(
                  citySuggestions[
                    company.countryCode as keyof typeof citySuggestions
                  ] ?? []
                ).map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
              <FieldError errors={[errors.city]} />
            </Field>
          </div>
        </FieldGroup>
      </FormSection>

      <FormSection
        id={KybAnchors.responsible}
        className="scroll-mt-24"
        title={t("settings.company.responsible.title")}
        description={t("settings.company.responsible.description")}
      >
        <FieldGroup>
          <Field data-invalid={!!errors.responsibleName}>
            <FieldLabel htmlFor="company-responsible">
              {t("settings.company.fields.responsibleName")}
            </FieldLabel>
            <Input
              id="company-responsible"
              autoComplete="name"
              aria-invalid={!!errors.responsibleName}
              {...form.register("responsibleName")}
            />
            <FieldDescription>
              {t("settings.company.fields.responsibleNameHint")}
            </FieldDescription>
            <FieldError errors={[errors.responsibleName]} />
          </Field>
          <Field data-invalid={!!errors.phone} className="sm:max-w-xs">
            <FieldLabel htmlFor="company-phone">
              {t("settings.company.fields.phone")}
            </FieldLabel>
            <Input
              id="company-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              aria-invalid={!!errors.phone}
              {...form.register("phone")}
            />
            <FieldDescription>
              {t("settings.company.fields.phoneHint", {
                prefix: company.phonePrefix,
              })}
            </FieldDescription>
            <FieldError errors={[errors.phone]} />
          </Field>
        </FieldGroup>
      </FormSection>

      <FormSection
        id={KybAnchors.address}
        className="scroll-mt-24"
        title={t("settings.company.address.title")}
        description={t("settings.company.address.description")}
      >
        <Field data-invalid={!!errors.address}>
          <FieldLabel htmlFor="company-address">
            {t("settings.company.fields.address")}
          </FieldLabel>
          <Input
            id="company-address"
            autoComplete="street-address"
            aria-invalid={!!errors.address}
            {...form.register("address")}
          />
          <FieldError errors={[errors.address]} />
        </Field>
      </FormSection>

      <FormSection
        id={KybAnchors.businessIds}
        className="scroll-mt-24"
        title={t("settings.company.businessIds.title")}
        description={t("settings.company.businessIds.description")}
      >
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
          {company.businessIdTypes.map((type) => {
            const name = `businessIds.${type}` as Path<CompanyFormValues>
            const error = errors.businessIds?.[type]
            const id = `company-id-${type}`
            return (
              <Field key={type} data-invalid={!!error}>
                <FieldLabel htmlFor={id}>
                  {isKnownBusinessIdType(type)
                    ? t(`settings.company.businessIds.types.${type}`)
                    : type}
                </FieldLabel>
                <Input
                  id={id}
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder={
                    isKnownBusinessIdType(type)
                      ? t(`settings.company.businessIds.examples.${type}`)
                      : undefined
                  }
                  aria-invalid={!!error}
                  {...form.register(name)}
                />
                <FieldError errors={[error]} />
              </Field>
            )
          })}
        </div>
      </FormSection>

      <FormActions>
        <Button type="submit" size="lg" disabled={update.isPending}>
          {update.isPending && <Spinner />}
          {t("settings.company.save")}
        </Button>
      </FormActions>
    </form>
  )
}
