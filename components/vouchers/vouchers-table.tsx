"use client"

import {
  DownloadIcon,
  EllipsisVerticalIcon,
  FileTextIcon,
  PrinterIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useFormatter, useTranslations } from "next-intl"

import { PersonName } from "@/components/profile/person-name"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { VoucherSummary } from "@/lib/api/vouchers"
import { RecordRoutes } from "@/lib/routes"
import { cn } from "@/lib/utils"

import { useVoucherPdf } from "./use-voucher-pdf"
import {
  DiscrepancyBadge,
  TransferStateBadge,
  VoucherTypeBadge,
} from "./voucher-badges"

/** « Dépôt Bonabéri → Boutique Akwa » pour un envoi de transfert. */
function warehouseLabel(voucher: VoucherSummary): string {
  return voucher.destination
    ? `${voucher.warehouse.name} → ${voucher.destination.name}`
    : voucher.warehouse.name
}

/**
 * Tableau des bons : numéro, sorte et état, date, dépôt, tiers, nombre d'articles, signataire. Sur
 * téléphone, le numéro et la sorte, puis la date et le dépôt en dessous. Toute la ligne ouvre le bon.
 */
export function VouchersTable({
  vouchers,
  stale,
}: {
  vouchers: VoucherSummary[]
  /** Page précédente affichée pendant le chargement de la suivante. */
  stale: boolean
}) {
  const t = useTranslations("vouchers")
  const format = useFormatter()
  const day = (voucher: VoucherSummary) =>
    format.dateTime(new Date(voucher.occurredAt), { dateStyle: "medium" })

  return (
    <Table className={cn("transition-opacity", stale && "opacity-60")}>
      <TableHeader className="bg-muted/40">
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-4">{t("table.number")}</TableHead>
          <TableHead className="hidden md:table-cell">
            {t("table.type")}
          </TableHead>
          <TableHead className="hidden md:table-cell">
            {t("table.date")}
          </TableHead>
          <TableHead className="hidden lg:table-cell">
            {t("table.warehouse")}
          </TableHead>
          <TableHead className="hidden xl:table-cell">
            {t("table.counterparty")}
          </TableHead>
          <TableHead className="hidden text-right lg:table-cell">
            {t("table.lines")}
          </TableHead>
          <TableHead className="hidden md:table-cell">
            {t("table.createdBy")}
          </TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {vouchers.map((voucher) => (
          <TableRow key={voucher.id} className="relative cursor-pointer">
            <TableCell className="py-3 pl-4">
              <Link
                href={RecordRoutes.voucher(voucher.id)}
                className="num font-semibold after:absolute after:inset-0 focus-visible:outline-none"
              >
                {voucher.number}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 md:hidden">
                <VoucherBadges voucher={voucher} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground md:hidden">
                {day(voucher)} · {warehouseLabel(voucher)}
              </p>
              <PersonName
                name={voucher.createdByName}
                photoUrl={voucher.createdByPhotoUrl}
                className="mt-1.5 flex text-xs text-muted-foreground md:hidden"
                avatarClassName="size-5"
              />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="flex flex-wrap items-center gap-1.5">
                <VoucherBadges voucher={voucher} />
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {day(voucher)}
              <p className="text-xs text-muted-foreground lg:hidden">
                {warehouseLabel(voucher)}
              </p>
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              {warehouseLabel(voucher)}
            </TableCell>
            <TableCell className="hidden xl:table-cell">
              {voucher.counterparty ?? (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="hidden text-right num lg:table-cell">
              {voucher.lineCount}
            </TableCell>
            <TableCell className="hidden max-w-48 text-muted-foreground md:table-cell">
              <PersonName
                name={voucher.createdByName}
                photoUrl={voucher.createdByPhotoUrl}
              />
            </TableCell>
            <TableCell className="pr-2">
              <VoucherRowMenu id={voucher.id} number={voucher.number} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function VoucherBadges({ voucher }: { voucher: VoucherSummary }) {
  return (
    <>
      <VoucherTypeBadge type={voucher.type} />
      {voucher.transferState && (
        <TransferStateBadge state={voucher.transferState} />
      )}
      {voucher.hasDiscrepancy && <DiscrepancyBadge />}
    </>
  )
}

/**
 * Actions d'une ligne de bon. Le bouton passe au-dessus du lien qui couvre la ligne : l'ouvrir ne
 * déclenche pas la navigation vers la fiche.
 */
function VoucherRowMenu({ id, number }: { id: string; number: string }) {
  const t = useTranslations("vouchers.menu")
  const router = useRouter()
  const pdf = useVoucherPdf()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative z-10"
            aria-label={t("open", { number })}
          />
        }
      >
        <EllipsisVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => router.push(RecordRoutes.voucher(id))}>
          <FileTextIcon />
          {t("detail")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={pdf.busy}
          onClick={() => void pdf.print(id)}
        >
          <PrinterIcon />
          {t("print")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={pdf.busy}
          onClick={() => void pdf.download(id)}
        >
          <DownloadIcon />
          {t("download")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
