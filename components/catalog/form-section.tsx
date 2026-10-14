import { cn } from "@/lib/utils"

/** Bloc de formulaire : titre et aide à gauche sur grand écran, champs à droite. */
export function FormSection({
  title,
  description,
  children,
  className,
  ...props
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
} & React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "grid gap-5 border-t py-8 first:border-t-0 first:pt-0 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-10",
        className
      )}
      {...props}
    >
      <div>
        <h2 className="font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

/** Actions du formulaire, toujours visibles en bas de l'écran. */
export function FormActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-4 flex items-center justify-end gap-2 border-t bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:-mx-8 sm:px-8">
      {children}
    </div>
  )
}
