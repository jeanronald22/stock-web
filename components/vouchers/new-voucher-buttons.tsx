"use client"

import {
  ArrowDownToLineIcon,
  ArrowRightLeftIcon,
  ArrowUpFromLineIcon,
  ChevronDownIcon,
  ClipboardCheckIcon,
  PackageXIcon,
  PlusIcon,
  Redo2Icon,
  Undo2Icon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useStockAccess } from "@/components/workspace/stock-access"
import { StockPermission } from "@/lib/api/stock"
import { Routes } from "@/lib/routes"
import { tourAnchor, TourAnchors } from "@/lib/tour/tours"
import { cn } from "@/lib/utils"

/**
 * Actions de création, communes à la liste et à l'écran vide : réception et sortie, les plus
 * fréquentes, en boutons ; transfert, casse et ajustement dans « Autre opération ».
 */
export function NewVoucherButtons({ className }: { className?: string }) {
  const t = useTranslations("vouchers")
  const router = useRouter()
  const { can } = useStockAccess()
  if (!can(StockPermission.recordMovements)) return null
  const corrects = can(StockPermission.correctStock)
  return (
    <div
      className={cn("flex w-full gap-2 sm:w-auto sm:flex-wrap", className)}
      {...tourAnchor(TourAnchors.newVoucher)}
    >
      {/* Téléphone : les deux opérations du quotidien tiennent sur une ligne, les autres derrière « + ». */}
      <Link
        href={Routes.newReceipt}
        aria-label={t("newReceipt")}
        className={buttonVariants({
          size: "lg",
          className: "flex-1 sm:flex-none",
        })}
      >
        <ArrowDownToLineIcon />
        <span className="sm:hidden">{t("types.RECEIPT")}</span>
        <span className="hidden sm:inline">{t("newReceipt")}</span>
      </Link>
      <Link
        href={Routes.newIssue}
        aria-label={t("newIssue")}
        className={buttonVariants({
          size: "lg",
          variant: "outline",
          className: "flex-1 sm:flex-none",
        })}
      >
        <ArrowUpFromLineIcon />
        <span className="sm:hidden">{t("types.ISSUE")}</span>
        <span className="hidden sm:inline">{t("newIssue")}</span>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size="lg"
              variant="outline"
              aria-label={t("otherOperation")}
              className="px-3 sm:px-4"
            />
          }
        >
          <PlusIcon className="sm:hidden" />
          <span className="hidden sm:inline">{t("otherOperation")}</span>
          <ChevronDownIcon className="hidden sm:block" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem onClick={() => router.push(Routes.newTransfer)}>
            <ArrowRightLeftIcon />
            <OperationLabel
              title={t("newTransfer")}
              hint={t("operations.transfer")}
            />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(Routes.newCustomerReturn)}
          >
            <Undo2Icon />
            <OperationLabel
              title={t("newCustomerReturn")}
              hint={t("operations.customerReturn")}
            />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(Routes.newSupplierReturn)}
          >
            <Redo2Icon />
            <OperationLabel
              title={t("newSupplierReturn")}
              hint={t("operations.supplierReturn")}
            />
          </DropdownMenuItem>
          {corrects && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(Routes.newDamage)}>
                <PackageXIcon />
                <OperationLabel
                  title={t("newDamage")}
                  hint={t("operations.damage")}
                />
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(Routes.newAdjustment)}
              >
                <ClipboardCheckIcon />
                <OperationLabel
                  title={t("newAdjustment")}
                  hint={t("operations.adjustment")}
                />
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function OperationLabel({ title, hint }: { title: string; hint: string }) {
  return (
    <span className="grid">
      <span>{title}</span>
      <span className="text-xs font-normal text-muted-foreground">{hint}</span>
    </span>
  )
}
