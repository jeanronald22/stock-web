"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { isProblem, ProblemCode } from "@/lib/api/problem"
import type { Item } from "@/lib/api/stock"
import { useSaveItem } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { applyServerErrors } from "@/lib/forms/apply-server-errors"
import { applyProblemToField } from "@/lib/forms/problem-fields"

import {
  itemFormDefaults,
  itemFormSchema,
  toItemInput,
  type ItemFormValues,
} from "./item-form-schema"

const FIELDS = [
  "name",
  "reference",
  "description",
  "baseUnit",
  "batchTracking",
  "packagings",
  "warehouses",
  "categoryId",
] as const

/**
 * Formulaire d'article, commun à l'assistant de création et à la fiche : valeurs, règles et
 * enregistrement. [submit] renvoie false si l'API a refusé (erreurs placées sur les champs).
 */
export function useItemForm(
  item: Item | undefined,
  defaultWarehouseIds: string[],
  onConflict?: () => void
) {
  const t = useTranslations()
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const save = useSaveItem()
  // Créé une seule fois : un nouvel envoi après une coupure réseau ne crée pas de doublon.
  const [id] = useState(() => item?.id ?? crypto.randomUUID())

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(
      itemFormSchema({
        required: t("validation.required"),
        tooLong: (max) => t("validation.tooLong", { max }),
        invalidNumber: t("validation.invalidNumber"),
        positive: t("validation.positive"),
        wholeNumber: t("validation.wholeNumber"),
        duplicateName: t("validation.duplicateName"),
      })
    ),
    defaultValues: itemFormDefaults(item, defaultWarehouseIds, locale),
  })

  const submit = async (values: ItemFormValues): Promise<boolean> => {
    try {
      await save.mutateAsync({
        id,
        version: item?.version,
        input: toItemInput(values),
      })
      return true
    } catch (error) {
      if (applyServerErrors(error, FIELDS, form.setError)) return false
      const placed = applyProblemToField<ItemFormValues>(
        error,
        {
          [ProblemCode.itemReferenceTaken]: "reference",
          [ProblemCode.warehouseUnavailable]: "warehouses",
          [ProblemCode.categoryUnavailable]: "categoryId",
          [ProblemCode.baseUnitLocked]: "baseUnit",
        },
        form.setError
      )
      if (placed) return false
      toast.error(errorMessage(error), {
        action:
          onConflict && isProblem(error, ProblemCode.editConflict)
            ? { label: t("common.reload"), onClick: onConflict }
            : undefined,
      })
      return false
    }
  }

  return { form, submit, pending: save.isPending, itemId: id }
}
