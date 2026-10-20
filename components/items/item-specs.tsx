"use client"

import {
  BarcodeIcon,
  BoxesIcon,
  CalendarPlusIcon,
  FolderTreeIcon,
  HashIcon,
  LayersIcon,
  RulerIcon,
  type LucideIcon,
} from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"

import { CopyButton } from "@/components/records/copy-button"
import { RecordSection } from "@/components/records/record-section"
import { EntryDirection, type Item } from "@/lib/api/stock"
import { cn } from "@/lib/utils"

import { useQuantityLabel } from "./describe"

/**
 * « Fiche technique » : ce qui identifie l'article et comment on le compte. Un champ vide est dit
 * « Non renseigné » : on voit ce qui manque à la fiche.
 */
export function ItemSpecs({
  item,
  category,
}: {
  item: Item
  category: string | undefined
}) {
  const t = useTranslations()
  const format = useFormatter()
  const quantityLabel = useQuantityLabel()
  const missing = t("items.detail.missing")
  return (
    <RecordSection
      id="item-specs-title"
      title={t("items.detail.facts")}
      description={t("items.detail.factsHint")}
    >
      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 2xl:grid-cols-3">
        <Spec icon={RulerIcon} label={t("items.detail.unit")}>
          {t(`units.${item.baseUnit}.label`)}
        </Spec>
        <Spec icon={LayersIcon} label={t("items.detail.batchTracking")}>
          {item.batchTracking
            ? t("items.detail.byBatch")
            : t("items.detail.noBatch")}
        </Spec>
        <Spec icon={FolderTreeIcon} label={t("items.detail.category")}>
          {category ?? <Missing>{missing}</Missing>}
        </Spec>
        <Spec
          icon={HashIcon}
          label={t("items.detail.reference")}
          copy={item.reference}
        >
          {item.reference ? (
            <span className="num">{item.reference}</span>
          ) : (
            <Missing>{missing}</Missing>
          )}
        </Spec>
        <Spec
          icon={BarcodeIcon}
          label={t("items.detail.barcode")}
          copy={item.barcode}
        >
          {item.barcode ? (
            <span className="num">{item.barcode}</span>
          ) : (
            <Missing>{missing}</Missing>
          )}
        </Spec>
        <Spec icon={CalendarPlusIcon} label={t("items.detail.createdAt")}>
          {format.dateTime(new Date(item.createdAt), { dateStyle: "long" })}
        </Spec>
        <Spec
          icon={BoxesIcon}
          label={t("items.detail.packagings")}
          className="sm:col-span-2 2xl:col-span-3"
        >
          {item.packagings.length === 0 ? (
            <Missing>{t("items.detail.noPackaging")}</Missing>
          ) : (
            <ul className="space-y-0.5">
              {item.packagings.map((packaging) => (
                <li key={packaging.name}>
                  {packaging.name} ={" "}
                  {quantityLabel(item.baseUnit, packaging.quantity)}
                  {(packaging.defaultReceipt || packaging.defaultIssue) && (
                    <span className="font-normal text-muted-foreground">
                      {" · "}
                      {t("items.detail.defaultFor", {
                        directions:
                          packaging.defaultReceipt && packaging.defaultIssue
                            ? "both"
                            : packaging.defaultReceipt
                              ? EntryDirection.receipt
                              : EntryDirection.issue,
                      })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Spec>
      </dl>
      {item.description && (
        <div className="mt-4 rounded-xl bg-muted/40 p-4">
          <p className="label-caps">{t("items.detail.description")}</p>
          <p className="mt-1 text-sm whitespace-pre-line">{item.description}</p>
        </div>
      )}
    </RecordSection>
  )
}

function Spec({
  icon: Icon,
  label,
  copy,
  className,
  children,
}: {
  icon: LucideIcon
  label: string
  /** Valeur à copier (code-barres, référence) ; rien à copier quand elle manque. */
  copy?: string | null
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
        aria-hidden
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 font-medium break-words">{children}</dd>
      </div>
      {copy && (
        <div className="ml-auto shrink-0">
          <CopyButton value={copy} label={label} />
        </div>
      )}
    </div>
  )
}

function Missing({ children }: { children: React.ReactNode }) {
  return <span className="font-normal text-muted-foreground">{children}</span>
}
