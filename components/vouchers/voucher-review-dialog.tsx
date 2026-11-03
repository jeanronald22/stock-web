"use client"

import { useFormatter, useTranslations } from "next-intl"

import { useQuantityLabel } from "@/components/items/describe"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { BaseUnit } from "@/lib/api/stock"
import { parseQuantity } from "@/lib/forms/quantity"

import { baseQuantity, type VoucherFormValues } from "./voucher-form-schema"

/** Ligne reçue autrement qu'annoncé, en unité de base. */
export type ReviewGap = {
  key: string
  name: string
  baseUnit: BaseUnit
  received: number
  announced: number
}

/** Ce que la réception compare : le bon de livraison du fournisseur, ou l'envoi du transfert. */
export const ReviewSource = {
  deliveryNote: "deliveryNote",
  transfer: "transfer",
} as const
export type ReviewSource = (typeof ReviewSource)[keyof typeof ReviewSource]

/** Ce qui mérite un second regard avant de valider : un bon validé ne se modifie plus (D21). */
export type VoucherReview = {
  source: ReviewSource
  gaps: ReviewGap[]
  /** Jour du bon (AAAA-MM-JJ) quand il est antérieur à aujourd'hui. */
  backdatedOn: string | null
}

/** null : rien à revoir, le bon se valide sans détour. */
export function reviewOf(
  values: VoucherFormValues,
  today: string
): VoucherReview | null {
  const gaps = values.lines.flatMap((line) => {
    const entered = parseQuantity(line.quantity)
    const expected = line.expected.trim() ? parseQuantity(line.expected) : null
    if (entered === null || expected === null) return []
    const received = baseQuantity(line.item, entered, line.unit)
    const announced = baseQuantity(line.item, expected, line.unit)
    if (received === announced) return []
    return [
      {
        key: line.key,
        name: line.item.name,
        baseUnit: line.item.baseUnit,
        received,
        announced,
      },
    ]
  })
  const backdatedOn = values.occurredOn < today ? values.occurredOn : null
  return gaps.length > 0 || backdatedOn
    ? { source: ReviewSource.deliveryNote, gaps, backdatedOn }
    : null
}

/** Récapitulatif avant validation : les écarts avec le bon de livraison, la date antérieure. */
export function VoucherReviewDialog({
  review,
  onConfirm,
  onCancel,
}: {
  review: VoucherReview | null
  onConfirm: () => void
  onCancel: () => void
}) {
  const t = useTranslations("vouchers.review")
  const format = useFormatter()
  const quantityLabel = useQuantityLabel()
  return (
    <AlertDialog
      open={review !== null}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("description")}</AlertDialogDescription>
        </AlertDialogHeader>
        {review && (
          <div className="space-y-3 text-sm">
            {review.gaps.length > 0 && (
              <div>
                <p className="font-medium">
                  {t(`${review.source}.gaps`, { count: review.gaps.length })}
                </p>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  {review.gaps.map((gap) => (
                    <li key={gap.key}>
                      {t(`${review.source}.gap`, {
                        name: gap.name,
                        received: quantityLabel(gap.baseUnit, gap.received),
                        announced: quantityLabel(gap.baseUnit, gap.announced),
                      })}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {review.backdatedOn && (
              <p className="font-medium">
                {t("backdated", {
                  date: format.dateTime(
                    new Date(`${review.backdatedOn}T12:00:00`),
                    { dateStyle: "long" }
                  ),
                })}
              </p>
            )}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogCancel variant="default" onClick={onConfirm}>
            {t("confirm")}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
