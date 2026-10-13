import { cn } from "@/lib/utils"
import { initials } from "@/lib/format"

/** Carré aux initiales de l'entreprise, rayon de la charte. */
export function OrganizationAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg bg-success-muted text-sm font-semibold text-success-muted-foreground",
        className
      )}
    >
      {initials(name)}
    </span>
  )
}
