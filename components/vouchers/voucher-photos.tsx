"use client"

import { CameraIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId } from "react"
import { toast } from "sonner"

import { Spinner } from "@/components/ui/spinner"
import { ItemImageRules } from "@/lib/api/stock"
import { useFileUrl } from "@/lib/api/use-file-url"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { useAddVoucherPhoto } from "@/lib/api/voucher-queries"
import { MAX_VOUCHER_PHOTOS, type Voucher } from "@/lib/api/vouchers"

const ACCEPT = ItemImageRules.types.join(",")

/**
 * Photos d'une casse, sur sa fiche (D28) : des preuves, qui s'ajoutent (5 au plus) mais ne se
 * retirent pas. Une photo s'ouvre en grand dans un nouvel onglet.
 */
export function VoucherPhotos({
  voucher,
  canAdd,
}: {
  voucher: Voucher
  canAdd: boolean
}) {
  const t = useTranslations("vouchers.photos")
  const fileUrl = useFileUrl()
  const errorMessage = useErrorMessage()
  const add = useAddVoucherPhoto()
  const inputId = useId()
  const photos = voucher.photoUrls
  const room = canAdd && photos.length < MAX_VOUCHER_PHOTOS
  if (photos.length === 0 && !room) return null

  const send = async (file: File | undefined) => {
    if (!file) return
    try {
      await add.mutateAsync({ id: voucher.id, file })
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <section className="mt-6 rounded-2xl border p-5">
      <h2 className="text-sm text-muted-foreground">
        {t("title")} (
        {t("count", { count: photos.length, max: MAX_VOUCHER_PHOTOS })})
      </h2>
      <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {photos.map((url, index) => {
          const src = fileUrl(url)
          return (
            <li key={url} className="aspect-square">
              {src && (
                <a href={src} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- lien signé de l'API, hors optimisation Next */}
                  <img
                    src={src}
                    alt={t("preview", { index: index + 1 })}
                    loading="lazy"
                    className="size-full rounded-lg border object-cover"
                  />
                </a>
              )}
            </li>
          )
        })}
        {room && (
          <li className="aspect-square">
            <label
              htmlFor={inputId}
              className="flex size-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground transition-colors hover:bg-muted/50"
            >
              {add.isPending ? (
                <Spinner />
              ) : (
                <CameraIcon className="size-5" aria-hidden />
              )}
              {t("add")}
            </label>
            <input
              id={inputId}
              type="file"
              accept={ACCEPT}
              capture="environment"
              className="sr-only"
              aria-label={t("addLabel")}
              disabled={add.isPending}
              onChange={(event) => {
                void send(event.target.files?.[0])
                event.target.value = ""
              }}
            />
          </li>
        )}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">{t("kept")}</p>
    </section>
  )
}
