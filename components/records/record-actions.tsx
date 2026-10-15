"use client"

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/** Une action du menu : aller quelque part (un bon prérempli, un inventaire…). */
export type RecordAction = { icon: LucideIcon; label: string; href: string }

/** Archivage depuis le menu : confirmé avant d'archiver, immédiat pour restaurer. */
export type RecordArchive = {
  archived: boolean
  labels: {
    action: string
    title: string
    description: string
    restore: string
  }
  onArchive: () => void
  onRestore: () => void
}

/**
 * Actions d'une fiche, les mêmes partout : « Modifier » en évidence pour qui peut modifier, le reste
 * dans « Autres actions » (bons préremplis, puis archiver ou restaurer).
 */
export function RecordActions({
  editHref,
  actions,
  archive,
}: {
  editHref?: string
  actions: RecordAction[]
  archive?: RecordArchive
}) {
  const t = useTranslations("records")
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const hasMenu = actions.length > 0 || !!archive

  return (
    <>
      {editHref && (
        <Link href={editHref} className={buttonVariants()}>
          <PencilIcon />
          {t("edit")}
        </Link>
      )}
      {hasMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="icon" aria-label={t("more")} />
            }
          >
            <EllipsisVerticalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {actions.map((action) => (
              <DropdownMenuItem
                key={action.href}
                onClick={() => router.push(action.href)}
              >
                <action.icon />
                {action.label}
              </DropdownMenuItem>
            ))}
            {actions.length > 0 && archive && <DropdownMenuSeparator />}
            {archive &&
              (archive.archived ? (
                <DropdownMenuItem onClick={archive.onRestore}>
                  <ArchiveRestoreIcon />
                  {archive.labels.restore}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setConfirming(true)}
                >
                  <ArchiveIcon />
                  {archive.labels.action}
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {archive && (
        <AlertDialog open={confirming} onOpenChange={setConfirming}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{archive.labels.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {archive.labels.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogCancel
                variant="destructive"
                onClick={archive.onArchive}
              >
                {archive.labels.action}
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
