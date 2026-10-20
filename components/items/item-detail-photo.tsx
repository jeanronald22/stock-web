"use client"

import { BoxIcon, ImagePlusIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Spinner } from "@/components/ui/spinner"
import type { Item } from "@/lib/api/stock"
import { useFileUrl } from "@/lib/api/use-file-url"

import { AddPhotosTrigger, type PhotoAdder } from "./item-photo-adder"

const FRAME =
  "flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/40 sm:size-28"

/**
 * Photo principale en tête de fiche, à gauche du nom : un clic ouvre les photos en grand. Sans
 * photo, qui gère le catalogue en ajoute d'ici ; les autres voient un carton.
 */
export function ItemDetailPhoto({
  item,
  adder,
  onOpen,
}: {
  item: Item
  /** Absent : la personne ne peut pas modifier l'article. */
  adder?: PhotoAdder
  onOpen: () => void
}) {
  const t = useTranslations("items")
  const fileUrl = useFileUrl()
  const src = fileUrl(item.imageUrl)
  const count = item.images.length

  if (src)
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`${FRAME} relative cursor-zoom-in transition-shadow hover:ring-3 hover:ring-ring/20 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none`}
        aria-label={t("detail.enlargePhoto", { name: item.name })}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- lien signé de l'API, hors optimisation Next */}
        <img src={src} alt="" className="size-full object-cover" />
        {count > 1 && (
          <span className="absolute right-1 bottom-1 rounded-md bg-background/85 px-1.5 num text-xs font-medium">
            {t("photos.position", { index: 1, total: count })}
          </span>
        )}
      </button>
    )
  if (adder?.sending)
    return (
      <span className={FRAME} aria-busy>
        <Spinner className="size-6" />
        <span className="sr-only">{t("photos.sending")}</span>
      </span>
    )
  if (adder)
    return (
      <AddPhotosTrigger
        adder={adder}
        label={t("photos.add")}
        className={`${FRAME} flex-col gap-1 border-2 border-dashed text-muted-foreground hover:border-primary/50 hover:text-primary`}
      >
        <ImagePlusIcon className="size-6 sm:size-7" aria-hidden />
        <span className="text-xs font-medium">{t("photos.addShort")}</span>
      </AddPhotosTrigger>
    )
  return (
    <span className={FRAME} aria-hidden>
      <BoxIcon className="size-8 text-primary sm:size-10" />
    </span>
  )
}
