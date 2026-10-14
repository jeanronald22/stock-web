"use client"

import { EyeIcon } from "lucide-react"
import { useTranslations } from "next-intl"

/** En tête d'une fiche que le rôle Stock permet de consulter, pas de modifier. */
export function ReadOnlyNotice() {
  const t = useTranslations("access")
  return (
    <p className="mb-6 flex items-center gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      <EyeIcon className="size-4 shrink-0" aria-hidden />
      {t("readOnly")}
    </p>
  )
}
