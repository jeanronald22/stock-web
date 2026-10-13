"use client"

import { useTranslations } from "next-intl"

import { KreskalaLogo } from "@/components/brand/kreskala-logo"
import { Button } from "@/components/ui/button"

/** Le carton se pose, la coche se dessine (geste de validation de la charte). */
export function DoneStep({ organizationName, onContinue }: { organizationName: string; onContinue: () => void }) {
  const t = useTranslations("welcome.done")
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-16 items-center px-4 sm:px-8">
        <KreskalaLogo className="h-8" />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <svg viewBox="0 0 160 110" className="w-44" role="img" aria-hidden>
            <rect x="14" y="98" width="132" height="3" rx="1.5" className="fill-border" />
            <rect x="42" y="52" width="46" height="46" rx="4" className="origin-bottom animate-carton-drop fill-success transform-fill" />
            <rect x="60" y="52" width="10" height="13" className="animate-carton-drop fill-white/55" />
            <circle cx="106" cy="44" r="18" className="animate-rise-in fill-primary [animation-delay:450ms]" />
            <path
              d="M97 44 l6 6 l12 -12"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-rise-in stroke-primary-foreground [animation-delay:600ms]"
            />
          </svg>
          <h1 className="mt-8 animate-rise-in text-3xl font-semibold tracking-tight [animation-delay:200ms]">{t("title")}</h1>
          <p className="mt-3 animate-rise-in text-lg text-muted-foreground text-pretty [animation-delay:300ms]">
            {t("description", { name: organizationName })}
          </p>
          <Button size="xl" className="mt-10 w-full animate-rise-in [animation-delay:400ms]" onClick={onContinue} autoFocus>
            {t("cta")}
          </Button>
        </div>
      </main>
    </div>
  )
}
