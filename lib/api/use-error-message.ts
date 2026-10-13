"use client"

import { useTranslations } from "next-intl"
import { useCallback } from "react"

import { ApiError, ProblemCode } from "@/lib/api/problem"

/**
 * Texte à montrer pour une erreur d'action. Les erreurs de l'API sont déjà traduites par
 * l'API elle-même ; seules les erreurs côté appareil (réseau) le sont ici.
 */
export function useErrorMessage(): (error: unknown) => string {
  const t = useTranslations("errors")
  return useCallback(
    (error: unknown) => {
      if (error instanceof ApiError) {
        if (error.code === ProblemCode.networkUnavailable) return t("network")
        if (error.detail) return error.detail
      }
      return t("generic")
    },
    [t]
  )
}
