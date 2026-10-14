import type { FieldValues, Path, UseFormSetError } from "react-hook-form"

import { ApiError } from "@/lib/api/problem"

/**
 * Erreur métier de l'API qui concerne un champ précis (nom déjà pris…) : affichée sous ce champ.
 * Renvoie false si l'erreur n'est pas rattachée à un champ.
 */
export function applyProblemToField<T extends FieldValues>(
  error: unknown,
  fieldsByCode: Partial<Record<string, Path<T>>>,
  setError: UseFormSetError<T>
): boolean {
  if (!(error instanceof ApiError)) return false
  const field = fieldsByCode[error.code]
  if (!field) return false
  setError(
    field,
    { type: "server", message: error.detail || error.title },
    { shouldFocus: true }
  )
  return true
}
