import { WifiOffIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { buttonVariants } from "@/components/ui/button"
import { Routes } from "@/lib/routes"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("offline.page")
  return { title: t("title") }
}

/**
 * Affichée par le service worker (D39) à la place d'une page jamais ouverte sur ce téléphone, quand
 * il n'y a pas de réseau. L'accueil et les écrans de saisie, eux, sont toujours là.
 */
export default async function OfflinePage() {
  const t = await getTranslations("offline.page")
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-warning-muted text-warning-muted-foreground">
        <WifiOffIcon className="size-7" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        {t("title")}
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">{t("description")}</p>
      <Link
        href={Routes.dashboard}
        className={buttonVariants({ className: "mt-6" })}
      >
        {t("home")}
      </Link>
    </main>
  )
}
