"use client"

import { FilterXIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"

/** Visible seulement quand au moins un filtre est posé. */
export function ClearFilters({
  visible,
  onClear,
}: {
  visible: boolean
  onClear: () => void
}) {
  const t = useTranslations("catalog")
  if (!visible) return null
  return (
    <Button variant="ghost" size="lg" className="h-11" onClick={onClear}>
      <FilterXIcon />
      {t("clearFilters")}
    </Button>
  )
}
