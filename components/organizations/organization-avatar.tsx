"use client"

import { useFileUrl } from "@/lib/api/use-file-url"
import { cn } from "@/lib/utils"
import { initials } from "@/lib/format"

/** Logo de l'entreprise (D45), ou à défaut un carré à ses initiales, rayon de la charte. */
export function OrganizationAvatar({
  name,
  logoUrl,
  className,
}: {
  name: string
  /** Lien signé renvoyé par l'API ; absent, les initiales. */
  logoUrl?: string | null
  className?: string
}) {
  const fileUrl = useFileUrl()
  const src = fileUrl(logoUrl ?? null)
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm font-semibold",
        // Un logo garde ses proportions sur fond clair : il n'est ni rogné ni teinté.
        src
          ? "border bg-white"
          : "bg-success-muted text-success-muted-foreground",
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- lien signé de l'API, hors optimisation Next
        <img src={src} alt="" className="size-full object-contain p-0.5" />
      ) : (
        initials(name)
      )}
    </span>
  )
}
