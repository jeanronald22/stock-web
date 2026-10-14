"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { UserRoundIcon } from "lucide-react"

import { IdentityScene } from "@/components/illustrations/identity-scene"
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
import { FieldLimits, type User } from "@/lib/api/platform"
import { useUpdateProfile } from "@/lib/api/platform-queries"
import { applyServerErrors } from "@/lib/forms/apply-server-errors"

import { StepShell } from "@/components/wizard/step-shell"
import { useErrorMessage } from "@/lib/api/use-error-message"

const FORM_ID = "welcome-profile"
const FIELDS = ["firstName", "lastName"] as const

export function ProfileStep({
  user,
  step,
  totalSteps,
  onDone,
  onExit,
}: {
  user: User
  step: number
  totalSteps: number
  onDone: () => void
  onExit: () => void
}) {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const updateProfile = useUpdateProfile()

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

  const submit = form.handleSubmit((values) =>
    updateProfile.mutate(values, {
      onSuccess: onDone,
      onError: (error) => {
        if (!applyServerErrors(error, FIELDS, form.setError))
          toast.error(errorMessage(error))
      },
    })
  )

  return (
    <StepShell
      step={step}
      illustration={<IdentityScene />}
      totalSteps={totalSteps}
      eyebrow={t("welcome.profile.eyebrow")}
      title={t("welcome.profile.title")}
      description={t("welcome.profile.description")}
      formId={FORM_ID}
      submitLabel={t("common.continue")}
      submitting={updateProfile.isPending}
      onExit={onExit}
    >
      <form id={FORM_ID} onSubmit={submit} noValidate>
        <FieldGroup className="sm:grid sm:grid-cols-2 sm:gap-4">
          {FIELDS.map((field) => (
            <Field key={field} data-invalid={!!form.formState.errors[field]}>
              <FieldLabel htmlFor={field}>
                {t(`welcome.profile.${field}`)}
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id={field}
                  autoComplete={
                    field === "firstName" ? "given-name" : "family-name"
                  }
                  autoCapitalize="words"
                  autoFocus={field === "firstName"}
                  placeholder={t(`welcome.profile.${field}Placeholder`)}
                  aria-invalid={!!form.formState.errors[field]}
                  {...form.register(field)}
                />
                <InputGroupAddon>
                  <UserRoundIcon />
                </InputGroupAddon>
              </InputGroup>
              <FieldError errors={[form.formState.errors[field]]} />
            </Field>
          ))}
        </FieldGroup>
      </form>
    </StepShell>
  )
}
