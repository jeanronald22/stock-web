import type { LucideIcon } from "lucide-react"

import { KreskalaLogo } from "@/components/brand/kreskala-logo"
import { Button } from "@/components/ui/button"

type Action = { label: string; onClick: () => void }

/** Message plein écran (erreur ou attente) avec une seule action possible : on ne laisse jamais la personne sans issue. */
export function FullPageMessage({
  icon: Icon,
  title,
  description,
  action,
  footnote,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: Action
  footnote?: string
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background px-4 sm:px-8">
      <header className="flex h-16 items-center">
        <KreskalaLogo className="h-8" />
      </header>
      <main className="flex flex-1 items-center justify-center pb-16">
        <div className="flex w-full max-w-sm flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <Icon className="size-6 text-muted-foreground" aria-hidden />
          </span>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-balance">
            {title}
          </h1>
          <p className="mt-2 text-pretty text-muted-foreground">
            {description}
          </p>
          {action && (
            <Button size="xl" className="mt-8 w-full" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {footnote && (
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              {footnote}
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
