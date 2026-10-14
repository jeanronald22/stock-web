import { cn } from "@/lib/utils"

import { Breadcrumbs, type Crumb } from "./breadcrumbs"

/** Titre d'écran : une ligne d'explication au plus, actions à droite (en dessous sur téléphone). */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  /** Fiches et saisies : chemin depuis la liste, avec retour. */
  breadcrumbs?: Crumb[]
  className?: string
}) {
  const header = (
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
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
  if (!breadcrumbs) return header
  return (
    <div>
      <Breadcrumbs items={breadcrumbs} />
      {header}
    </div>
  )
}

/** Marges communes des écrans de travail : toute la largeur disponible, à côté de la barre latérale. */
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
        "w-full px-4 pt-6 pb-24 sm:px-6 sm:pt-8 lg:px-10",
        className
      )}
    >
      {children}
    </div>
  )
}
