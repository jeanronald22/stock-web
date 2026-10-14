"use client"

import { useTranslations } from "next-intl"

import { KreskalaLogo } from "@/components/brand/kreskala-logo"
import { ValidatedScene } from "@/components/illustrations/validated-scene"
import { Button } from "@/components/ui/button"

/** Le carton se pose, la coche se dessine (geste de validation de la charte). */
export function DoneStep({
  organizationName,
  onContinue,
}: {
  organizationName: string
  onContinue: () => void
}) {
  const t = useTranslations("welcome.done")
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-16 items-center px-4 sm:px-8">
        <KreskalaLogo className="h-8" />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <ValidatedScene className="w-64" />
          <h1 className="mt-8 animate-rise-in text-3xl font-semibold tracking-tight [animation-delay:200ms]">
            {t("title")}
          </h1>
          <p className="mt-3 animate-rise-in text-lg text-pretty text-muted-foreground [animation-delay:300ms]">
            {t("description", { name: organizationName })}
          </p>
          <Button
            size="xl"
            className="mt-10 w-full animate-rise-in [animation-delay:400ms]"
            onClick={onContinue}
            autoFocus
          >
            {t("cta")}
          </Button>
        </div>
      </main>
    </div>
  )
}
