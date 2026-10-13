import { KreskalaLogo } from "@/components/brand/kreskala-logo"

/** Écran d'attente plein écran : le logo se construit pendant le chargement (geste de la charte). */
export function Splash({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4">
      <KreskalaLogo animated className="h-11" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
