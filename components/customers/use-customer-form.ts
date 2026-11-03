"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { useSaveCustomer } from "@/lib/api/customer-queries"
import {
  CustomerKind,
  customerKinds,
  CustomerLimits,
  type Customer,
} from "@/lib/api/customers"
import { isProblem, ProblemCode } from "@/lib/api/problem"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { applyServerErrors } from "@/lib/forms/apply-server-errors"
import { looksLikePhone } from "@/lib/forms/phone"
import { applyProblemToField } from "@/lib/forms/problem-fields"

const FIELDS = ["kind", "name", "phone", "address", "note"] as const

function customerSchema(messages: {
  required: string
  phone: string
  tooLong: (max: number) => string
}) {
  const text = (max: number) =>
    z.string().trim().max(max, messages.tooLong(max))
  return z.object({
    kind: z.enum(customerKinds),
    name: text(CustomerLimits.name).min(1, messages.required),
    phone: text(CustomerLimits.phone).refine(
      (value) => !value || looksLikePhone(value),
      messages.phone
    ),
    address: text(CustomerLimits.address),
    note: text(CustomerLimits.note),
  })
}

export type CustomerFormValues = z.infer<ReturnType<typeof customerSchema>>

/**
 * Fiche d'un client ou d'un chantier, commune à la création rapide et à la fiche. [submit] renvoie
 * la fiche enregistrée, ou null si l'API a refusé (erreurs placées sur les champs).
 */
export function useCustomerForm(
  customer: Customer | undefined,
  onConflict?: () => void,
  initial?: Partial<CustomerFormValues>
) {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const save = useSaveCustomer()
  // Créé une seule fois : un nouvel envoi après une coupure réseau ne crée pas de doublon.
  const [id, setId] = useState(() => customer?.id ?? crypto.randomUUID())

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(
      customerSchema({
        required: t("validation.required"),
        phone: t("validation.phone"),
        tooLong: (max) => t("validation.tooLong", { max }),
      })
    ),
    defaultValues: {
      kind: customer?.kind ?? initial?.kind ?? CustomerKind.site,
      name: customer?.name ?? initial?.name ?? "",
      phone: customer?.phone ?? "",
      address: customer?.address ?? "",
      note: customer?.note ?? "",
    },
  })

  const submit = async (
    values: CustomerFormValues
  ): Promise<Customer | null> => {
    try {
      const saved = await save.mutateAsync({
        id,
        version: customer?.version,
        input: {
          kind: values.kind,
          name: values.name,
          phone: values.phone || undefined,
          address: values.address || undefined,
          note: values.note || undefined,
        },
      })
      // Création : la suivante aura son propre identifiant.
      if (!customer) setId(crypto.randomUUID())
      return saved
    } catch (error) {
      if (applyServerErrors(error, FIELDS, form.setError)) return null
      if (
        applyProblemToField(
          error,
          {
            [ProblemCode.customerNameTaken]: "name",
            [ProblemCode.phoneInvalid]: "phone",
          },
          form.setError
        )
      )
        return null
      toast.error(errorMessage(error), {
        action:
          onConflict && isProblem(error, ProblemCode.editConflict)
            ? { label: t("common.reload"), onClick: onConflict }
            : undefined,
      })
      return null
    }
  }

  return { form, submit, pending: save.isPending }
}
