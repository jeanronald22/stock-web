import { cn } from "@/lib/utils"

/** Titre d'écran : une ligne d'explication au plus, actions à droite (en dessous sur téléphone). */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="animate-rise-in text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}

/** Largeur et marges communes des écrans de travail. */
export function PageBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-5xl px-4 pt-6 pb-24 sm:px-8 sm:pt-10",
        className
      )}
    >
      {children}
    </div>
  )
}
