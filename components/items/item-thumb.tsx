"use client"

import { BoxIcon } from "lucide-react"

import { useFileUrl } from "@/lib/api/use-file-url"
import { cn } from "@/lib/utils"

const SIZES = {
  sm: "size-8 rounded-md [&_svg]:size-4",
  md: "size-10 rounded-lg [&_svg]:size-4",
  lg: "size-14 rounded-xl [&_svg]:size-6",
  /** Fiche de l'article : assez grande pour le reconnaître dans les rayons. */
  xl: "size-28 rounded-2xl [&_svg]:size-10",
} as const

/** Vignette d'un article, partout où il est listé : sa photo, ou un carton à défaut. */
export function ItemThumb({
  imageUrl,
  size = "md",
  className,
}: {
  imageUrl: string | null | undefined
  size?: keyof typeof SIZES
  className?: string
}) {
  const fileUrl = useFileUrl()
  const src = fileUrl(imageUrl ?? null)
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-primary/10 text-primary",
        SIZES[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- lien signé de l'API, hors optimisation Next
        <img
          src={src}
          alt=""
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        <BoxIcon />
      )}
    </span>
  )
}
