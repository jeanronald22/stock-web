"use client"

import { ImageUpIcon, RefreshCwIcon, Trash2Icon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRef } from "react"
import { toast } from "sonner"

import { OrganizationAvatar } from "@/components/organizations/organization-avatar"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { useRemoveLogo, useUploadLogo } from "@/lib/api/company-queries"
import { CompanyLimits, LOGO_TYPES, type Company } from "@/lib/api/company"
import { useErrorMessage } from "@/lib/api/use-error-message"

/**
 * Logo de l'entreprise (D45), dans la fiche mais enregistré dès le dépôt, sans attendre le bouton du
 * formulaire : il remplace les initiales dans le sélecteur d'entreprise de chaque membre.
 */
export function CompanyLogo({ company }: { company: Company }) {
  const t = useTranslations("settings.company.logo")
  const errorMessage = useErrorMessage()
  const upload = useUploadLogo()
  const remove = useRemoveLogo()
  const input = useRef<HTMLInputElement>(null)
  const busy = upload.isPending || remove.isPending

  const choose = (file: File | undefined) => {
    if (!file) return
    // Un type inconnu du navigateur (vide) est laissé à l'API, qui reconnaît l'image au contenu.
    if (file.type && !(LOGO_TYPES as readonly string[]).includes(file.type)) {
      toast.error(t("unsupported"))
      return
    }
    if (file.size > CompanyLimits.documentBytes) {
      toast.error(t("tooLarge"))
      return
    }
    upload.mutate(file, {
      onSuccess: () => toast.success(t("uploaded")),
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <Field>
      <FieldLabel>{t("title")}</FieldLabel>
      <div className="flex flex-wrap items-center gap-4">
        <OrganizationAvatar
          name={company.name}
          logoUrl={company.logoUrl}
          className="size-20 rounded-2xl text-xl"
        />
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept={LOGO_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => {
              choose(event.target.files?.[0])
              event.target.value = ""
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            {upload.isPending ? (
              <Spinner />
            ) : company.logoUrl ? (
              <RefreshCwIcon />
            ) : (
              <ImageUpIcon />
            )}
            {company.logoUrl ? t("replace") : t("upload")}
          </Button>
          {company.logoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() =>
                remove.mutate(undefined, {
                  onSuccess: () => toast.success(t("removed")),
                  onError: (error) => toast.error(errorMessage(error)),
                })
              }
            >
              {remove.isPending ? <Spinner /> : <Trash2Icon />}
              {t("remove")}
            </Button>
          )}
        </div>
      </div>
      <FieldDescription>{t("description")}</FieldDescription>
    </Field>
  )
}
