import { MapPinIcon } from "lucide-react"

import type { LocationRef } from "@/lib/api/stock"
import { cn } from "@/lib/utils"

/** « A-03-2 · Allée A, rayon 3 » : le code se lit sur l'étagère, le libellé l'explique. */
export function LocationLabel({
  location,
  className,
}: {
  location: LocationRef
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1 text-sm text-muted-foreground",
        className
      )}
    >
      <MapPinIcon className="size-3.5 shrink-0" aria-hidden />
      <span className="font-mono font-medium text-foreground">
        {location.code}
      </span>
      {location.label && <span className="truncate">· {location.label}</span>}
    </span>
  )
}
