"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { ImageDropzone } from "@/components/catalog/image-dropzone"
import type { Item } from "@/lib/api/stock"
import { useRemoveItemImage, useUploadItemImage } from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { useFileUrl } from "@/lib/api/use-file-url"

/** Aperçu local d'un fichier choisi, libéré quand il change. */
function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    // Abonnement à une ressource du navigateur : l'URL n'existe qu'entre création et libération.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(objectUrl)
    return () => {
      URL.revokeObjectURL(objectUrl)
      setUrl(null)
    }
  }, [file])
  return url
}

/** Assistant : la photo est gardée ici et envoyée une fois l'article créé. */
export function PendingPhotoField({
  file,
  onChange,
}: {
  file: File | null
  onChange: (file: File | null) => void
}) {
  const preview = useObjectUrl(file)
  return (
    <ImageDropzone
      previewUrl={preview}
      onSelect={onChange}
      onRemove={() => onChange(null)}
    />
  )
}

/** Fiche : la photo est envoyée dès qu'elle est choisie, indépendamment du reste du formulaire. */
export function ItemPhotoField({ item }: { item: Item }) {
  const t = useTranslations("images")
  const fileUrl = useFileUrl()
  const errorMessage = useErrorMessage()
  const upload = useUploadItemImage()
  const remove = useRemoveItemImage()
  const [pending, setPending] = useState<File | null>(null)
  const preview = useObjectUrl(pending)

  return (
    <ImageDropzone
      previewUrl={preview ?? fileUrl(item.imageUrl)}
      busy={upload.isPending || remove.isPending}
      onSelect={(file) => {
        setPending(file)
        upload.mutate(
          { id: item.id, file },
          {
            onSuccess: () => toast.success(t("saved")),
            onError: (error) => toast.error(errorMessage(error)),
            onSettled: () => setPending(null),
          }
        )
      }}
      onRemove={
        item.imageUrl
          ? () =>
              remove.mutate(item.id, {
                onSuccess: () => toast.success(t("removed")),
                onError: (error) => toast.error(errorMessage(error)),
              })
          : undefined
      }
    />
  )
}
