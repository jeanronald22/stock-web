"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { isProblem, ProblemCode } from "@/lib/api/problem"
import { StockLimits, warehouseKinds, type Warehouse } from "@/lib/api/stock"
import { useSaveWarehouse } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { applyServerErrors } from "@/lib/forms/apply-server-errors"
import { applyProblemToField } from "@/lib/forms/problem-fields"

const FIELDS = ["name", "kind", "city", "address"] as const

function warehouseSchema(required: string, tooLong: (max: number) => string) {
  const text = (max: number) => z.string().trim().max(max, tooLong(max))
  return z.object({
    name: text(StockLimits.name).min(1, required),
    kind: z.enum(warehouseKinds),
    city: text(StockLimits.city),
    address: text(StockLimits.address),
  })
}

export type WarehouseFormValues = z.infer<ReturnType<typeof warehouseSchema>>

/**
 * Formulaire de dépôt, commun à l'assistant de création et à la fiche : valeurs, règles et
 * enregistrement. [submit] renvoie false si l'API a refusé (erreurs placées sur les champs).
 */
export function useWarehouseForm(
  warehouse: Warehouse | undefined,
  onConflict?: () => void
) {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const save = useSaveWarehouse()
  // Créé une seule fois : un nouvel envoi après une coupure réseau ne crée pas de doublon.
  const [id] = useState(() => warehouse?.id ?? crypto.randomUUID())

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(
      warehouseSchema(t("validation.required"), (max) =>
        t("validation.tooLong", { max })
      )
    ),
    defaultValues: {
      name: warehouse?.name ?? "",
      kind: warehouse?.kind ?? "WAREHOUSE",
      city: warehouse?.city ?? "",
      address: warehouse?.address ?? "",
    },
  })

  const submit = async (input: WarehouseFormValues): Promise<boolean> => {
    try {
      await save.mutateAsync({ id, version: warehouse?.version, input })
      return true
    } catch (error) {
      if (applyServerErrors(error, FIELDS, form.setError)) return false
      if (
        applyProblemToField(
          error,
          { [ProblemCode.warehouseNameTaken]: "name" },
          form.setError
        )
      )
        return false
      toast.error(errorMessage(error), {
        action:
          onConflict && isProblem(error, ProblemCode.editConflict)
            ? { label: t("common.reload"), onClick: onConflict }
            : undefined,
      })
      return false
    }
  }

  return { form, submit, pending: save.isPending }
}
