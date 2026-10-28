"use client"

import { WifiOffIcon } from "lucide-react"
import { useTranslations } from "next-intl"

/**
 * Plein écran, à la place du chargement : sans réseau, et rien de gardé sur ce téléphone pour
 * ouvrir l'espace de travail (D39). L'écran se remplace de lui-même au retour du réseau.
 */
export function OfflineNotReady() {
  const t = useTranslations("offline.notReady")
  return (
    <div
      role="status"
      className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-warning-muted text-warning-muted-foreground">
        <WifiOffIcon className="size-7" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        {t("title")}
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">{t("description")}</p>
    </div>
  )
}
