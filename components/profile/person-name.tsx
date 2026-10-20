import { cn } from "@/lib/utils"

import { PersonAvatar } from "./person-avatar"

/** Nom d'une personne précédé de sa photo de profil, ou de ses initiales (D46). */
export function PersonName({
  name,
  photoUrl,
  className,
  avatarClassName,
}: {
  name: string
  photoUrl: string | null
  className?: string
  /** Taille de la photo : celle du texte qui l'accompagne. */
  avatarClassName?: string
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <PersonAvatar
        name={name}
        photoUrl={photoUrl}
        className={cn("size-6", avatarClassName)}
        fallbackClassName="text-[0.625rem]"
      />
      <span className="truncate">{name}</span>
    </span>
  )
}
