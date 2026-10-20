"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useFileUrl } from "@/lib/api/use-file-url"
import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"

/** Photo de profil d'une personne (D46), ou ses initiales si elle n'en a pas, ou pendant le chargement. */
export function PersonAvatar({
  name,
  photoUrl,
  className,
  fallbackClassName,
}: {
  name: string
  /** Lien signé renvoyé par l'API ; absent, les initiales. */
  photoUrl?: string | null
  className?: string
  fallbackClassName?: string
}) {
  const fileUrl = useFileUrl()
  const src = fileUrl(photoUrl ?? null)
  return (
    <Avatar aria-hidden className={cn("shrink-0", className)}>
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback
        className={cn(
          "bg-primary/10 font-semibold text-primary",
          fallbackClassName
        )}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
