"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { FormSection } from "@/components/catalog/form-section"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { FieldLimits, type User } from "@/lib/api/platform"
import { useUpdateProfile } from "@/lib/api/platform-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { applyServerErrors } from "@/lib/forms/apply-server-errors"

const FIELDS = ["firstName", "lastName"] as const

/**
 * Prénom et nom (D46) : ils signent les bons (« validé par Awa Bello »). L'adresse e-mail est
 * l'identifiant de connexion : elle se lit ici, sans se modifier.
 */
export function ProfileIdentity({ user }: { user: User }) {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const update = useUpdateProfile()

  const name = z
    .string()
    .trim()
    .min(1, t("validation.required"))
    .max(
      FieldLimits.personName,
      t("validation.tooLong", { max: FieldLimits.personName })
    )
  const form = useForm({
    resolver: zodResolver(z.object({ firstName: name, lastName: name })),
    defaultValues: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
    },
  })
  const errors = form.formState.errors

  const submit = form.handleSubmit((values) =>
    update.mutate(values, {
      onSuccess: () => {
        form.reset(values)
        toast.success(t("profile.identity.saved"))
      },
      onError: (error) => {
        if (!applyServerErrors(error, FIELDS, form.setError))
          toast.error(errorMessage(error))
      },
    })
  )

  return (
    <FormSection
      title={t("profile.identity.title")}
      description={t("profile.identity.description")}
    >
      <form onSubmit={submit} noValidate>
        <FieldGroup>
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
            {FIELDS.map((field) => (
              <Field key={field} data-invalid={!!errors[field]}>
                <FieldLabel htmlFor={`profile-${field}`}>
                  {t(`welcome.profile.${field}`)}
                </FieldLabel>
                <Input
                  id={`profile-${field}`}
                  autoComplete={
                    field === "firstName" ? "given-name" : "family-name"
                  }
                  autoCapitalize="words"
                  aria-invalid={!!errors[field]}
                  {...form.register(field)}
                />
                <FieldError errors={[errors[field]]} />
              </Field>
            ))}
          </div>
          {user.email && (
            <Field>
              <FieldLabel htmlFor="profile-email">
                {t("profile.identity.email")}
              </FieldLabel>
              <Input id="profile-email" value={user.email} readOnly disabled />
              <FieldDescription>
                {t("profile.identity.emailHint")}
              </FieldDescription>
            </Field>
          )}
          <div>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending && <Spinner />}
              {t("profile.identity.save")}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </FormSection>
  )
}
