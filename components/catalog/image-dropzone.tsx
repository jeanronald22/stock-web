"use client"

import { ImageIcon, ImageUpIcon, Trash2Icon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ItemImageRules } from "@/lib/api/stock"
import { cn } from "@/lib/utils"

const ACCEPT = ItemImageRules.types.join(",")
const MEGABYTE = 1024 * 1024

/**
 * Zone de dépôt d'une photo : glisser-déposer ou toucher pour choisir (appareil photo sur téléphone).
 * Le format et le poids sont vérifiés avant l'envoi ; l'API les revérifie.
 */
export function ImageDropzone({
  previewUrl,
  busy,
  onSelect,
  onRemove,
  className,
}: {
  previewUrl: string | null
  busy?: boolean
  onSelect: (file: File) => void
  onRemove?: () => void
  className?: string
}) {
  const t = useTranslations("images")
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accept = (file: File | undefined) => {
    if (!file) return
    if (!(ItemImageRules.types as readonly string[]).includes(file.type))
      return setError(t("unsupported"))
    if (file.size > ItemImageRules.maxBytes)
      return setError(
        t("tooLarge", { max: ItemImageRules.maxBytes / MEGABYTE })
      )
    setError(null)
    onSelect(file)
  }

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          accept(event.dataTransfer.files[0])
        }}
        className={cn(
          "relative flex aspect-[4/3] w-full max-w-sm cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "hover:border-foreground/30 hover:bg-muted/40",
          previewUrl && "border-solid"
        )}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- lien signé de l'API, hors optimisation Next
          <img
            src={previewUrl}
            alt={t("preview")}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <>
            <span
              className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
              aria-hidden
            >
              <ImageUpIcon className="size-6" />
            </span>
            <span className="px-6">
              <span className="block font-semibold">{t("choose")}</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {t("hint")}
              </span>
            </span>
          </>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Spinner className="size-6" />
          </span>
        )}
        <input
          ref={input}
          id={inputId}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            accept(event.target.files?.[0])
            event.target.value = ""
          }}
        />
      </label>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {previewUrl && (
        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            <ImageIcon />
            {t("replace")}
          </Button>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={onRemove}
            >
              <Trash2Icon />
              {t("remove")}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
