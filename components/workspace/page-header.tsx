import { cn } from "@/lib/utils"

import { Breadcrumbs, type Crumb } from "./breadcrumbs"

/**
 * Titre d'écran : une ligne d'explication au plus, actions à droite (en dessous sur téléphone).
 * Les états (type de bon, « En cours », « Archivé ») suivent le titre : ils décrivent la fiche, ce
 * ne sont pas des actions.
 */
export function PageHeader({
  title,
  visual,
  badges,
  description,
  actions,
  breadcrumbs,
  className,
}: {
  title: string
  /** Fiches : photo ou icône à gauche du titre. */
  visual?: React.ReactNode
  badges?: React.ReactNode
  description?: string
  actions?: React.ReactNode
  /** Fiches et saisies : chemin depuis la liste, avec retour. */
  breadcrumbs?: Crumb[]
  className?: string
}) {
  const header = (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:justify-between",
        // Avec une photo, les actions s'alignent sur le milieu du bloc, pas sous la photo.
        visual ? "sm:items-center" : "sm:items-end",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        {visual}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="animate-rise-in text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {badges && (
              <div className="flex flex-wrap items-center gap-1.5">
                {badges}
              </div>
            )}
          </div>
          {description && (
            // Une adresse e-mail sous un nom ne se coupe pas d'elle-même : elle passe à la ligne où il faut.
            <p className="mt-1 wrap-anywhere text-muted-foreground">
              {description}
            </p>
          )}
        </div>
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
