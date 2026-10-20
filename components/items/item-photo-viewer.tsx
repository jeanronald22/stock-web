"use client"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { Item } from "@/lib/api/stock"
import {
  useMakeMainItemImage,
  useRemoveItemImageEntry,
} from "@/lib/api/stock-queries"
import { useErrorMessage } from "@/lib/api/use-error-message"
import { useFileUrl } from "@/lib/api/use-file-url"
import { cn } from "@/lib/utils"

const MAIN = 0

/**
 * Les photos de l'article en grand, une à une (flèches, clavier, vignettes). Qui gère le catalogue
 * y choisit la principale ou en supprime une. [index] null : fermé.
 */
export function ItemPhotoViewer({
  item,
  index,
  onIndexChange,
  manages,
}: {
  item: Item
  index: number | null
  onIndexChange: (index: number | null) => void
  manages: boolean
}) {
  const t = useTranslations("items.photos")
  const fileUrl = useFileUrl()
  const errorMessage = useErrorMessage()
  const makeMain = useMakeMainItemImage()
  const remove = useRemoveItemImageEntry()
  const photos = item.images
  const current = index === null ? undefined : photos[index]
  const total = photos.length
  const busy = makeMain.isPending || remove.isPending
  const go = (step: number) =>
    index !== null && onIndexChange((index + step + total) % total)

  return (
    <Dialog
      open={current !== undefined}
      onOpenChange={(open) => !open && onIndexChange(null)}
    >
      {current && index !== null && (
        <DialogContent
          className="gap-3 sm:max-w-3xl"
          onKeyDown={(event) => {
            if (total < 2) return
            if (event.key === "ArrowLeft") go(-1)
            if (event.key === "ArrowRight") go(1)
          }}
        >
          <div className="flex items-center gap-2 pr-10">
            <DialogTitle className="truncate">{item.name}</DialogTitle>
            {index === MAIN && <Badge variant="secondary">{t("main")}</Badge>}
          </div>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- lien signé de l'API, hors optimisation Next */}
            <img
              src={fileUrl(current.url) ?? undefined}
              alt={t("photoOf", { index: index + 1, total, name: item.name })}
              className="h-[50vh] w-full rounded-xl bg-muted/40 object-contain sm:h-[60vh]"
            />
            {total > 1 && (
              <>
                <span className="absolute top-2 left-2 rounded-md bg-background/85 px-2 py-0.5 num text-sm font-medium">
                  {t("position", { index: index + 1, total })}
                </span>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full shadow"
                  aria-label={t("previous")}
                  onClick={() => go(-1)}
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full shadow"
                  aria-label={t("next")}
                  onClick={() => go(1)}
                >
                  <ChevronRightIcon />
                </Button>
              </>
            )}
          </div>
          {total > 1 && (
            <ul className="flex gap-2 overflow-x-auto">
              {photos.map((photo, position) => (
                <li key={photo.id} className="shrink-0">
                  <button
                    type="button"
                    aria-label={t("open", { index: position + 1, total })}
                    aria-current={position === index}
                    onClick={() => onIndexChange(position)}
                    className={cn(
                      "block size-14 overflow-hidden rounded-lg bg-muted/40 opacity-60 transition hover:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none",
                      position === index && "opacity-100 ring-2 ring-primary"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- lien signé de l'API, hors optimisation Next */}
                    <img
                      src={fileUrl(photo.url) ?? undefined}
                      alt=""
                      className="size-full object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {manages && (
            <div className="flex gap-2 sm:justify-end">
              {index !== MAIN && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  disabled={busy}
                  onClick={() =>
                    makeMain.mutate(
                      { id: item.id, imageId: current.id },
                      {
                        // La photo choisie passe en tête : on reste dessus.
                        onSuccess: () => {
                          onIndexChange(MAIN)
                          toast.success(t("mainChanged"))
                        },
                        onError: (error) => toast.error(errorMessage(error)),
                      }
                    )
                  }
                >
                  <StarIcon />
                  {t("makeMain")}
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button variant="ghost" size="sm" disabled={busy}>
                      <Trash2Icon />
                      {t("remove")}
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("removeTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {index === MAIN && total > 1
                        ? t("removeMainDescription")
                        : t("removeDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("keep")}</AlertDialogCancel>
                    <AlertDialogCancel
                      variant="destructive"
                      onClick={() =>
                        remove.mutate(
                          { id: item.id, imageId: current.id },
                          {
                            onSuccess: () => {
                              toast.success(t("removed"))
                              onIndexChange(
                                total > 1 ? Math.min(index, total - 2) : null
                              )
                            },
                            onError: (error) =>
                              toast.error(errorMessage(error)),
                          }
                        )
                      }
                    >
                      {t("remove")}
                    </AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  )
}
