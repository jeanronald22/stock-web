import type { FieldValues, Path, UseFormSetError } from "react-hook-form"

import { ApiError, ProblemCode } from "@/lib/api/problem"

/**
 * Place les erreurs de validation renvoyées par l'API sous les champs concernés. Renvoie
 * false si l'erreur ne concerne aucun champ du formulaire (à afficher autrement).
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>
): boolean {
  if (!(error instanceof ApiError) || error.code !== ProblemCode.validationFailed) return false
  const known = error.fieldErrors.filter((fieldError) => fields.includes(fieldError.field as Path<T>))
  known.forEach((fieldError) =>
    setError(fieldError.field as Path<T>, { type: "server", message: fieldError.message })
  )
  return known.length > 0
}
