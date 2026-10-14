"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { MailIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { AccessScene } from "@/components/illustrations/access-scene"
import { DepotsScene } from "@/components/illustrations/depots-scene"
import { InvitationScene } from "@/components/illustrations/invitation-scene"
import { TeamScene } from "@/components/illustrations/team-scene"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { FormWizard, type WizardStep } from "@/components/wizard/form-wizard"
import { useWorkspace } from "@/components/workspace/workspace-context"
import {
  assignableRoles,
  FieldLimits,
  MembershipRole,
  type InvitationSent,
} from "@/lib/api/platform"
import { isProblem, ProblemCode } from "@/lib/api/problem"
import { stockRoles } from "@/lib/api/stock"
import { useInvite } from "@/lib/api/team-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { Routes } from "@/lib/routes"

import { InvitationSentScreen } from "./invitation-sent-screen"
import {
  AssignedWarehousesField,
  ChoiceCard,
  needsWarehouses,
  NO_STOCK_ROLE,
  StockRoleField,
} from "./stock-access-fields"

function invitationSchema(messages: {
  required: string
  email: string
  tooLong: string
  warehousesRequired: string
}) {
  return z
    .object({
      email: z
        .string()
        .trim()
        .min(1, messages.required)
        .max(FieldLimits.email, messages.tooLong)
        .refine((value) => z.email().safeParse(value).success, messages.email),
      role: z.enum(assignableRoles),
      stockRole: z.enum([...stockRoles, NO_STOCK_ROLE]),
      warehouseIds: z.array(z.string()),
    })
    .superRefine((values, context) => {
      if (needsWarehouses(values.stockRole) && values.warehouseIds.length === 0)
        context.addIssue({
          code: "custom",
          path: ["warehouseIds"],
          message: messages.warehousesRequired,
        })
    })
}

type InvitationFormValues = z.infer<ReturnType<typeof invitationSchema>>

/**
 * Invitation en quelques questions (DECISIONS.md, D25) : qui, quel rôle dans l'équipe (le
 * propriétaire seul nomme un administrateur), que fera-t-elle dans Stock, et dans quels dépôts.
 */
export function InvitationWizard() {
  const t = useTranslations()
  const router = useRouter()
  const errorMessage = useErrorMessage()
  const { organization } = useWorkspace()
  const invite = useInvite()
  // Un identifiant par invitation : un envoi répété après une coupure ne crée pas de doublon.
  const [id, setId] = useState(() => crypto.randomUUID())
  const [sent, setSent] = useState<InvitationSent | null>(null)
  const ownerInvites = organization.role === MembershipRole.owner

  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(
      invitationSchema({
        required: t("validation.required"),
        email: t("validation.email"),
        tooLong: t("validation.tooLong", { max: FieldLimits.email }),
        warehousesRequired: t("team.wizard.warehouses.required"),
      })
    ),
    defaultValues: {
      email: "",
      role: MembershipRole.member,
      stockRole: NO_STOCK_ROLE,
      warehouseIds: [],
    },
  })
  const stockRole = useWatch({ control: form.control, name: "stockRole" })

  if (sent) {
    return (
      <InvitationSentScreen
        sent={sent}
        onInviteAnother={() => {
          form.reset()
          setId(crypto.randomUUID())
          setSent(null)
        }}
      />
    )
  }

  const steps: WizardStep<InvitationFormValues>[] = [
    {
      key: "email",
      illustration: <InvitationScene />,
      title: t("team.wizard.email.title"),
      description: t("team.wizard.email.description"),
      fields: ["email"],
      content: (
        <Field data-invalid={!!form.formState.errors.email}>
          <FieldLabel htmlFor="email">{t("team.invite.email")}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="email"
              type="email"
              autoFocus
              autoComplete="off"
              placeholder={t("team.invite.emailPlaceholder")}
              aria-invalid={!!form.formState.errors.email}
              {...form.register("email")}
            />
            <InputGroupAddon>
              <MailIcon />
            </InputGroupAddon>
          </InputGroup>
          <FieldError errors={[form.formState.errors.email]} />
        </Field>
      ),
    },
    ...(ownerInvites
      ? [
          {
            key: "role",
            illustration: <TeamScene />,
            title: t("team.wizard.role.title"),
            description: t("team.wizard.role.description"),
            fields: ["role"],
            content: (
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <div
                    role="radiogroup"
                    aria-label={t("team.role.label")}
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    {assignableRoles.map((role) => (
                      <ChoiceCard
                        key={role}
                        selected={field.value === role}
                        label={t(`team.role.${role}.label`)}
                        hint={t(`team.role.${role}.hint`)}
                        onSelect={() => field.onChange(role)}
                      />
                    ))}
                  </div>
                )}
              />
            ),
          } satisfies WizardStep<InvitationFormValues>,
        ]
      : []),
    {
      key: "stockRole",
      illustration: <AccessScene />,
      title: t("team.wizard.stockRole.title"),
      description: t("team.wizard.stockRole.description"),
      fields: ["stockRole"],
      content: (
        <Controller
          control={form.control}
          name="stockRole"
          render={({ field }) => (
            <StockRoleField value={field.value} onChange={field.onChange} />
          )}
        />
      ),
    },
    ...(needsWarehouses(stockRole)
      ? [
          {
            key: "warehouses",
            illustration: <DepotsScene />,
            title: t("team.wizard.warehouses.title"),
            description: t("team.wizard.warehouses.description"),
            fields: ["warehouseIds"],
            content: (
              <Controller
                control={form.control}
                name="warehouseIds"
                render={({ field, fieldState }) => (
                  <>
                    <AssignedWarehousesField
                      value={field.value}
                      onChange={field.onChange}
                      invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </>
                )}
              />
            ),
          } satisfies WizardStep<InvitationFormValues>,
        ]
      : []),
  ]

  return (
    <FormWizard
      form={form}
      steps={steps}
      eyebrow={t("team.wizard.eyebrow")}
      nextLabel={t("common.continue")}
      submitLabel={t("team.invite.submit")}
      submitting={invite.isPending}
      exitLabel={t("common.cancel")}
      onExit={() => router.push(Routes.team)}
      onSubmit={async (values) => {
        try {
          setSent(
            await invite.mutateAsync({
              id,
              email: values.email,
              role: values.role,
              access:
                values.stockRole === NO_STOCK_ROLE
                  ? null
                  : {
                      role: values.stockRole,
                      warehouseIds: needsWarehouses(values.stockRole)
                        ? values.warehouseIds
                        : [],
                    },
            })
          )
          return true
        } catch (error) {
          // Déjà membre ou déjà invitée : l'explication va sous l'adresse (première étape).
          if (
            isProblem(error, ProblemCode.memberAlreadyExists) ||
            isProblem(error, ProblemCode.invitationAlreadyPending)
          ) {
            form.setError("email", {
              type: "server",
              message: error.detail || error.title,
            })
          } else toast.error(errorMessage(error))
          return false
        }
      }}
    />
  )
}
