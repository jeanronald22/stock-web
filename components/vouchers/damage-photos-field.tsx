"use client"

import { CameraIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useId, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { ItemImageRules } from "@/lib/api/stock"
import { MAX_VOUCHER_PHOTOS } from "@/lib/api/vouchers"

const ACCEPT = ItemImageRules.types.join(",")
const MEGABYTE = 1024 * 1024

/**
 * Photos d'une casse (D28), choisies avant la validation et envoyées juste après : sur téléphone,
 * l'appareil photo s'ouvre directement. Format et poids vérifiés ici, puis par l'API.
 */
export function DamagePhotosField({
  files,
  onChange,
}: {
  files: File[]
  onChange: (files: File[]) => void
}) {
  const t = useTranslations("vouchers.photos")
  const inputId = useId()
  const [error, setError] = useState<string | null>(null)
  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  )
  useEffect(
    () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
    [previews]
  )

  const add = (selected: FileList | null) => {
    const accepted = Array.from(selected ?? []).filter((file) => {
      if (!(ItemImageRules.types as readonly string[]).includes(file.type)) {
        setError(t("unsupported"))
        return false
      }
      if (file.size > ItemImageRules.maxBytes) {
        setError(
          t("tooLarge", { max: Math.round(ItemImageRules.maxBytes / MEGABYTE) })
        )
        return false
      }
      return true
    })
    if (accepted.length) setError(null)
    onChange([...files, ...accepted].slice(0, MAX_VOUCHER_PHOTOS))
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium">
        {t("label")}{" "}
        <span className="font-normal text-muted-foreground">
          ({t("count", { count: files.length, max: MAX_VOUCHER_PHOTOS })})
        </span>
      </p>
      <ul className="grid grid-cols-3 gap-2">
        {previews.map((url, index) => (
          <li key={url} className="relative aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob), hors optimisation Next */}
            <img
              src={url}
              alt={t("preview", { index: index + 1 })}
              className="size-full rounded-lg border object-cover"
            />
            <Button
              type="button"
              size="icon-xs"
              variant="secondary"
              className="absolute top-1 right-1"
              aria-label={t("remove", { index: index + 1 })}
              onClick={() =>
                onChange(files.filter((_, position) => position !== index))
              }
            >
              <XIcon />
            </Button>
          </li>
        ))}
        {files.length < MAX_VOUCHER_PHOTOS && (
          <li className="aspect-square">
            <label
              htmlFor={inputId}
              className="flex size-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground transition-colors hover:bg-muted/50"
            >
              <CameraIcon className="size-5" aria-hidden />
              {t("add")}
            </label>
            <input
              id={inputId}
              type="file"
              accept={ACCEPT}
              capture="environment"
              multiple
              className="sr-only"
              aria-label={t("addLabel")}
              onChange={(event) => {
                add(event.target.files)
                event.target.value = ""
              }}
            />
          </li>
        )}
      </ul>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      <p className="mt-1 text-xs text-muted-foreground">{t("hint")}</p>
    </div>
  )
}
