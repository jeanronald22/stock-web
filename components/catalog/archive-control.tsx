"use client"

import { ArchiveIcon, ArchiveRestoreIcon } from "lucide-react"
import { useTranslations } from "next-intl"

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
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type ArchiveLabels = { action: string; title: string; description: string }

/**
 * Archiver demande confirmation (la fiche disparaît des listes) ; restaurer est immédiat.
 */
export function ArchiveControl({
  archived,
  pending,
  archiveLabels,
  restoreLabel,
  onArchive,
  onRestore,
}: {
  archived: boolean
  pending: boolean
  archiveLabels: ArchiveLabels
  restoreLabel: string
  onArchive: () => void
  onRestore: () => void
}) {
  const t = useTranslations("common")

  if (archived) {
    return (
      <Button variant="outline" onClick={onRestore} disabled={pending}>
        {pending ? <Spinner /> : <ArchiveRestoreIcon />}
        {restoreLabel}
      </Button>
    )
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            className="text-muted-foreground"
            disabled={pending}
          />
        }
      >
        <ArchiveIcon />
        {archiveLabels.action}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{archiveLabels.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {archiveLabels.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogCancel variant="destructive" onClick={onArchive}>
            {archiveLabels.action}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
