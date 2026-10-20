"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import {
  IMAGE_ACCEPT,
  useImageCheck,
} from "@/components/catalog/use-image-check"
import { ItemImageRules, type Item } from "@/lib/api/stock"
import { useAddItemImage } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { cn } from "@/lib/utils"

export type PhotoAdder = {
  /** Places encore libres sur les cinq. */
  remaining: number
  /** Photos en cours d'envoi. */
  sending: number
  add: (files: File[]) => void
}

/**
 * Ajout de photos depuis la fiche, sans passer par le formulaire : plusieurs fichiers d'un coup,
 * dans la limite de cinq par article. Envoyées l'une après l'autre, elles gardent l'ordre choisi.
 */
export function usePhotoAdder(item: Item): PhotoAdder {
  const t = useTranslations("items.photos")
  const errorMessage = useErrorMessage()
  const check = useImageCheck()
  const upload = useAddItemImage()
  const [sending, setSending] = useState(0)
  const remaining = Math.max(
    0,
    ItemImageRules.maxCount - item.images.length - sending
  )

  const add = async (files: File[]) => {
    const valid = files.filter((file) => {
      const problem = check(file)
      if (problem) toast.error(problem)
      return !problem
    })
    if (valid.length > remaining)
      toast.warning(
        t("tooMany", { max: ItemImageRules.maxCount, count: remaining })
      )
    const batch = valid.slice(0, remaining)
    if (batch.length === 0) return
    setSending((count) => count + batch.length)
    let added = 0
    try {
      for (const file of batch) {
        // Tiré une fois par fichier : un renvoi après coupure n'ajoute pas de doublon.
        await upload.mutateAsync({
          id: item.id,
          imageId: crypto.randomUUID(),
          file,
        })
        added += 1
        setSending((count) => count - 1)
      }
    } catch (failure) {
      toast.error(errorMessage(failure))
    } finally {
      setSending((count) => count - (batch.length - added))
    }
    if (added > 0) toast.success(t("added", { count: added }))
  }

  return { remaining, sending, add: (files) => void add(files) }
}

/**
 * Zone qui ouvre le choix de fichiers (appareil photo sur téléphone) et accepte le glisser-déposer.
 * Le champ est dans la zone : le clavier y arrive, le libellé le nomme.
 */
export function AddPhotosTrigger({
  adder,
  label,
  className,
  children,
}: {
  adder: PhotoAdder
  /** Nom lu par les lecteurs d'écran, quand le contenu n'est qu'une icône. */
  label: string
  className?: string
  children: React.ReactNode
}) {
  const [dragging, setDragging] = useState(false)
  const full = adder.remaining === 0
  return (
    <label
      className={cn(
        "relative cursor-pointer transition-colors focus-within:ring-3 focus-within:ring-ring/30",
        dragging && "border-primary bg-primary/10",
        full && "pointer-events-none opacity-50",
        className
      )}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        adder.add(Array.from(event.dataTransfer.files))
      }}
    >
      {children}
      <input
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        className="sr-only"
        aria-label={label}
        disabled={full}
        onChange={(event) => {
          adder.add(Array.from(event.target.files ?? []))
          event.target.value = ""
        }}
      />
    </label>
  )
}
