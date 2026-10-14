"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { useGrantMember } from "@/lib/api/team-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"

import {
  isAccessComplete,
  StockAccessFields,
  type StockAccessValue,
} from "./stock-access-fields"

/** Accès Stock d'un membre : rôle et dépôts, ou plus aucun accès. */
export function AccessSheet({
  subject,
  name,
  initial,
  open,
  onOpenChange,
}: {
  subject: string
  name: string
  initial: StockAccessValue
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations()
  const errorMessage = useErrorMessage()
  const grant = useGrantMember()
  const [value, setValue] = useState(initial)

  const save = () =>
    grant.mutate(
      {
        subject,
        access: value.role
          ? { role: value.role, warehouseIds: value.warehouseIds }
          : null,
      },
      {
        onSuccess: () => {
          toast.success(t("team.access.saved", { name }))
          onOpenChange(false)
        },
        onError: (error) => toast.error(errorMessage(error)),
      }
    )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{t("team.access.title", { name })}</SheetTitle>
          <SheetDescription>{t("team.access.description")}</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 p-4">
          <StockAccessFields value={value} onChange={setValue} />
          <Button
            size="xl"
            className="w-full"
            disabled={grant.isPending || !isAccessComplete(value)}
            onClick={save}
          >
            {grant.isPending && <Spinner data-icon="inline-start" />}
            {t("common.save")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
