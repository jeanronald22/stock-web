"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ApiError, ProblemCode } from "@/lib/api/problem"
import { StockLimits, type Location } from "@/lib/api/stock"
import { useSaveLocation } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"

/**
 * Nouvel emplacement d'un dépôt, ou modification d'un existant ([location]). Le code est ce qui
 * s'écrit sur l'étagère ; le libellé l'explique à qui ne connaît pas le dépôt.
 */
export function LocationDialog({
  open,
  onOpenChange,
  warehouseId,
  location,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  warehouseId: string
  location: Location | null
}) {
  const t = useTranslations("locations.dialog")
  const errorMessage = useErrorMessage()
  const save = useSaveLocation()
  const [code, setCode] = useState(location?.code ?? "")
  const [label, setLabel] = useState(location?.label ?? "")
  const [codeError, setCodeError] = useState<string | null>(null)

  const submit = async () => {
    const trimmed = code.trim()
    if (!trimmed) return setCodeError(t("codeRequired"))
    try {
      await save.mutateAsync({
        id: location?.id ?? crypto.randomUUID(),
        warehouseId,
        version: location?.version,
        input: { code: trimmed, label: label.trim() || undefined },
      })
      toast.success(location ? t("saved") : t("created", { code: trimmed }))
      onOpenChange(false)
    } catch (failure) {
      if (
        failure instanceof ApiError &&
        failure.code === ProblemCode.locationCodeTaken
      )
        setCodeError(errorMessage(failure))
      else toast.error(errorMessage(failure))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{location ? t("editTitle") : t("newTitle")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <form
          id="location-form"
          noValidate
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <Field data-invalid={!!codeError}>
            <FieldLabel htmlFor="location-code">{t("code")}</FieldLabel>
            <Input
              id="location-code"
              autoFocus
              autoComplete="off"
              className="font-mono uppercase"
              maxLength={StockLimits.locationCode}
              value={code}
              aria-invalid={!!codeError}
              placeholder={t("codePlaceholder")}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase())
                setCodeError(null)
              }}
            />
            {codeError ? (
              <FieldError errors={[{ message: codeError }]} />
            ) : (
              <FieldDescription>{t("codeHint")}</FieldDescription>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="location-label">{t("label")}</FieldLabel>
            <Input
              id="location-label"
              autoComplete="off"
              maxLength={StockLimits.locationLabel}
              value={label}
              placeholder={t("labelPlaceholder")}
              onChange={(event) => setLabel(event.target.value)}
            />
          </Field>
        </form>
        <DialogFooter>
          <Button type="submit" form="location-form" disabled={save.isPending}>
            {save.isPending && <Spinner />}
            {location ? t("save") : t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
