"use client"

import Link from "next/link"

import { EmptyState } from "@/components/catalog/empty-state"
import { SearchScene } from "@/components/illustrations/search-scene"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageBody } from "@/components/workspace/page-header"

/** Chargement d'une fiche : la forme de la page, sans contenu. */
export function RecordSkeleton() {
  return (
    <PageBody>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-8 h-36 rounded-2xl" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </PageBody>
  )
}

/** Fiche introuvable (lien ancien, autre entreprise) : retour à la liste. */
export function RecordNotFound({
  title,
  listLabel,
  listHref,
}: {
  title: string
  listLabel: string
  listHref: string
}) {
  return (
    <PageBody>
      <EmptyState
        illustration={<SearchScene />}
        title={title}
        description=""
        action={
          <Link
            href={listHref}
            className={buttonVariants({ variant: "outline" })}
          >
            {listLabel}
          </Link>
        }
      />
    </PageBody>
  )
}
