"use client"

import { useQueryClient } from "@tanstack/react-query"
import { LogOutIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useAuth } from "react-oidc-context"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { isOnline } from "@/lib/offline/connectivity"
import { removeOutboxEntry } from "@/lib/offline/outbox"
import { clearPersistedQueries } from "@/lib/offline/query-persister"
import { useOutbox } from "@/lib/offline/use-outbox"

/**
 * Se déconnecter (D39) : rien de l'entreprise ne reste sur le téléphone, ni les lectures gardées
 * ni la file d'envoi. S'il reste des saisies non envoyées, on prévient avant de les perdre.
 */
export function SignOutItem() {
  const t = useTranslations()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const { entries } = useOutbox()
  const [confirming, setConfirming] = useState(false)

  const signOut = async () => {
    // Keycloak ferme la session en ligne : sans réseau, rien ne serait vraiment fermé.
    if (!isOnline()) return toast.error(t("offline.signOut.needsNetwork"))
    await Promise.all(entries.map((entry) => removeOutboxEntry(entry.id)))
    queryClient.clear()
    await clearPersistedQueries()
    await auth.signoutRedirect()
  }

  return (
    <>
      <DropdownMenuItem
        onClick={() =>
          entries.length > 0 ? setConfirming(true) : void signOut()
        }
      >
        <LogOutIcon />
        {t("common.signOut")}
      </DropdownMenuItem>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("offline.signOut.title", { count: entries.length })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("offline.signOut.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("offline.signOut.stay")}</AlertDialogCancel>
            <AlertDialogCancel
              variant="destructive"
              onClick={() => void signOut()}
            >
              {t("offline.signOut.confirm")}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
