import { ArrowLeftIcon, ChevronRightIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

export type Crumb = { label: string; href?: string }

/**
 * Fil d'Ariane des fiches et des saisies : le premier élément ramène à la liste (flèche de retour),
 * le dernier est l'écran courant. Sur téléphone, seul le retour reste, la place étant comptée.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const t = useTranslations("workspace")
  return (
    <nav aria-label={t("breadcrumbs")} className="mb-4">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const first = index === 0
          const last = index === items.length - 1
          return (
            <li
              key={`${item.label}-${index}`}
              className={
                first
                  ? "flex items-center"
                  : "hidden min-w-0 items-center gap-1.5 sm:flex"
              }
            >
              {!first && (
                <ChevronRightIcon className="size-3.5 shrink-0" aria-hidden />
              )}
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                >
                  {first && <ArrowLeftIcon className="size-4" aria-hidden />}
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className="truncate text-foreground"
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
