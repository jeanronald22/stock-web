"use client"

import { CheckIcon, CopyIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useCallback } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useCopy } from "@/hooks/use-copy"

/** Copie d'une valeur d'une fiche (code-barres, référence) : à coller dans un bon de commande, un e-mail. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const t = useTranslations("records.copy")
  const { copied, copy } = useCopy(
    useCallback(() => toast.error(t("failed")), [t])
  )
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground"
      aria-label={copied ? t("done", { label }) : t("action", { label })}
      onClick={() => void copy(value)}
    >
      {copied ? <CheckIcon className="text-primary" /> : <CopyIcon />}
    </Button>
  )
}
