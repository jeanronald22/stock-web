import { cn } from "@/lib/utils"

/**
 * Bloc d'un onglet de fiche : titre, une ligne sur ce qu'il montre, une action à droite (« Voir
 * tout », « Seuils d'alerte »), puis son contenu.
 */
export function RecordSection({
  id,
  title,
  description,
  actions,
  children,
  className,
}: {
  /** Identifiant du titre, pour nommer la section. */
  id: string
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn("rounded-2xl border p-4 sm:p-5", className)}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id={id} className="text-lg font-semibold">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}
