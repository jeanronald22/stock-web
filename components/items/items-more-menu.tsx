"use client"

import {
  EllipsisVerticalIcon,
  FileSpreadsheetIcon,
  TagIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Routes } from "@/lib/routes"

/** Actions moins fréquentes du catalogue (D36) : importer un fichier, imprimer des étiquettes. */
export function ItemsMoreMenu() {
  const t = useTranslations("items.more")
  const router = useRouter()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon-lg" aria-label={t("label")} />
        }
      >
        <EllipsisVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem onClick={() => router.push(Routes.importItems)}>
          <FileSpreadsheetIcon />
          {t("import")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(Routes.labels)}>
          <TagIcon />
          {t("labels")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
