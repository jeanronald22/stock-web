"use client"

import { useTranslations } from "next-intl"

import { KreskalaLogo } from "@/components/brand/kreskala-logo"
import { AnchoredElements } from "@/components/motion/transitions"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"

type StepShellProps = {
  step: number
  /** Scène abstraite de l'étape (components/illustrations). */
  illustration: React.ReactNode
  totalSteps: number
  eyebrow: string
  title: string
  description: string
  formId: string
  submitLabel: string
  submitting: boolean
  onBack?: () => void
  onExit: () => void
  /** « Quitter » par défaut ; « Annuler » pour une création qu'on abandonne. */
  exitLabel?: string
  children: React.ReactNode
}

/**
 * Cadre des assistants (inscription, création d'un dépôt, d'un article). Une question par écran, l'action principale toujours visible en bas : sur téléphone, elle
 * reste accessible même quand le clavier est ouvert.
 */
export function StepShell({
  step,
  illustration,
  totalSteps,
  eyebrow,
  title,
  description,
  formId,
  submitLabel,
  submitting,
  onBack,
  onExit,
  exitLabel,
  children,
}: StepShellProps) {
  const t = useTranslations()
  const progress = Math.round((step / totalSteps) * 100)

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header
        style={{ viewTransitionName: AnchoredElements.header }}
        className="sticky top-0 z-10 flex h-16 items-center justify-between bg-background/90 px-4 backdrop-blur sm:px-8"
      >
        <KreskalaLogo className="h-8" />
        <Button variant="ghost" onClick={onExit}>
          {exitLabel ?? t("welcome.exit")}
        </Button>
      </header>

      <main className="flex flex-1 justify-center px-4 pt-4 pb-36 sm:px-8 sm:pt-12 lg:items-center lg:pt-6">
        <div className="grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div className="w-full max-w-lg justify-self-center lg:justify-self-start">
            <div className="mb-6 w-40 lg:hidden">{illustration}</div>
            <p className="text-sm font-semibold text-primary">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-base text-pretty text-muted-foreground sm:text-lg">
              {description}
            </p>
            <div className="mt-10">{children}</div>
          </div>
          <div
            aria-hidden
            className="hidden aspect-[4/3] items-center justify-center rounded-3xl bg-success-muted p-12 lg:flex"
          >
            {illustration}
          </div>
        </div>
      </main>

      <footer
        style={{ viewTransitionName: AnchoredElements.footer }}
        className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <Progress
          value={progress}
          aria-label={t("welcome.step", { current: step, total: totalSteps })}
          className="**:data-[slot=progress-track]:h-1 **:data-[slot=progress-track]:rounded-none"
        />
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between gap-4 px-4 sm:px-8">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="text-base font-semibold underline underline-offset-4 hover:text-primary"
            >
              {t("common.back")}
            </button>
          ) : (
            <span className="text-sm text-muted-foreground">
              {t("welcome.step", { current: step, total: totalSteps })}
            </span>
          )}
          <Button
            type="submit"
            form={formId}
            size="xl"
            disabled={submitting}
            className="min-w-36"
          >
            {submitting && <Spinner data-icon="inline-start" />}
            {submitLabel}
          </Button>
        </div>
      </footer>
    </div>
  )
}
