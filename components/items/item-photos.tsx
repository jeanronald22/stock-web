"use client"

import { ImagePlusIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { RecordSection } from "@/components/records/record-section"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { ItemImageRules, type Item } from "@/lib/api/stock"
import { useFileUrl } from "@/lib/api/use-file-url"

import { AddPhotosTrigger, type PhotoAdder } from "./item-photo-adder"

const TILE =
  "flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-muted/40"

/**
 * Les photos de l'article, cinq au plus : la première est la principale (listes, aperçu). Un clic
 * en ouvre une en grand ; qui gère le catalogue en ajoute ici, sans ouvrir le formulaire.
 */
export function ItemPhotos({
  item,
  adder,
  onOpen,
}: {
  item: Item
  /** Absent : la personne ne peut pas modifier l'article. */
  adder?: PhotoAdder
  onOpen: (index: number) => void
}) {
  const t = useTranslations("items.photos")
  const fileUrl = useFileUrl()
  const total = item.images.length
  if (total === 0 && !adder) return null

  return (
    <RecordSection
      id="item-photos-title"
      title={t("title")}
      description={
        adder
          ? t("hint", { count: total, max: ItemImageRules.maxCount })
          : t("count", { count: total })
      }
    >
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {item.images.map((photo, index) => (
          <li key={photo.id} className="relative">
            <button
              type="button"
              aria-label={t("open", { index: index + 1, total })}
              onClick={() => onOpen(index)}
              className={`${TILE} w-full cursor-zoom-in transition-shadow hover:ring-3 hover:ring-ring/20 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- lien signé de l'API, hors optimisation Next */}
              <img
                src={fileUrl(photo.url) ?? undefined}
                alt=""
                className="size-full object-cover"
              />
            </button>
            {index === 0 && (
              <Badge
                variant="secondary"
                className="pointer-events-none absolute bottom-2 left-2 shadow-sm"
              >
                {t("main")}
              </Badge>
            )}
          </li>
        ))}
        {adder &&
          Array.from({ length: adder.sending }, (_, index) => (
            <li key={`sending-${index}`} className={TILE} aria-busy>
              <Spinner className="size-6" />
              <span className="sr-only">{t("sending")}</span>
            </li>
          ))}
        {adder && adder.remaining > 0 && (
          <li>
            <AddPhotosTrigger
              adder={adder}
              label={t("add")}
              className={`${TILE} w-full flex-col gap-1 border-2 border-dashed text-center text-muted-foreground hover:border-primary/50 hover:text-primary`}
            >
              <ImagePlusIcon className="size-6" aria-hidden />
              <span className="px-2 text-sm font-medium">{t("addShort")}</span>
              <span className="num text-xs">
                {t("used", {
                  count: total + adder.sending,
                  max: ItemImageRules.maxCount,
                })}
              </span>
            </AddPhotosTrigger>
          </li>
        )}
      </ul>
    </RecordSection>
  )
}
