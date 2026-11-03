"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { isProblem, ProblemCode } from "@/lib/api/problem"
import { useSaveSupplier } from "@/lib/api/supplier-queries"
import { SupplierLimits, type Supplier } from "@/lib/api/suppliers"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { applyServerErrors } from "@/lib/forms/apply-server-errors"
import { looksLikePhone } from "@/lib/forms/phone"
import { applyProblemToField } from "@/lib/forms/problem-fields"

const FIELDS = ["name", "phone", "email", "address", "note"] as const

function supplierSchema(messages: {
  required: string
  phone: string
  email: string
  tooLong: (max: number) => string
}) {
  const text = (max: number) =>
    z.string().trim().max(max, messages.tooLong(max))
  return z.object({
    name: text(SupplierLimits.name).min(1, messages.required),
    phone: text(SupplierLimits.phone).refine(
      (value) => !value || looksLikePhone(value),
      messages.phone
    ),
    email: text(SupplierLimits.email).refine(
      (value) => !value || z.email().safeParse(value).success,
      messages.email
    ),
    address: text(SupplierLimits.address),
    note: text(SupplierLimits.note),
  })
}

export type SupplierFormValues = z.infer<ReturnType<typeof supplierSchema>>

/**
 * Coordonnées d'un fournisseur, communes à l'assistant de création et à la fiche. Le catalogue
 * est passé à part ([itemIds]) : il se modifie sur sa propre section. [submit] renvoie le
 * fournisseur enregistré, ou null si l'API a refusé (erreurs placées sur les champs).
 */
export function useSupplierForm(
  supplier: Supplier | undefined,
  onConflict?: () => void
) {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const save = useSaveSupplier()
  // Créé une seule fois : un nouvel envoi après une coupure réseau ne crée pas de doublon.
  const [id] = useState(() => supplier?.id ?? crypto.randomUUID())

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(
      supplierSchema({
        required: t("validation.required"),
        phone: t("validation.phone"),
        email: t("validation.email"),
        tooLong: (max) => t("validation.tooLong", { max }),
      })
    ),
    defaultValues: {
      name: supplier?.name ?? "",
      phone: supplier?.phone ?? "",
      email: supplier?.email ?? "",
      address: supplier?.address ?? "",
      note: supplier?.note ?? "",
    },
  })

  const submit = async (
    values: SupplierFormValues,
    itemIds: string[]
  ): Promise<Supplier | null> => {
    try {
      return await save.mutateAsync({
        id,
        version: supplier?.version,
        input: {
          name: values.name,
          phone: values.phone || undefined,
          email: values.email || undefined,
          address: values.address || undefined,
          note: values.note || undefined,
          itemIds,
        },
      })
    } catch (error) {
      if (applyServerErrors(error, FIELDS, form.setError)) return null
      if (
        applyProblemToField(
          error,
          {
            [ProblemCode.supplierNameTaken]: "name",
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
