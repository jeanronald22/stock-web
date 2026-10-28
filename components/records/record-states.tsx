"use client"

import type { FetchStatus } from "@tanstack/react-query"
import { WifiOffIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { EmptyState } from "@/components/catalog/empty-state"
import { SearchScene } from "@/components/illustrations/search-scene"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageBody } from "@/components/workspace/page-header"
import { waitsForNetwork } from "@/lib/offline/waits-for-network"

export const RecordState = {
  loading: "loading",
  /** Rien sur ce téléphone et pas de réseau : la lecture attend son retour. */
  offline: "offline",
  /** Données là, ou rien à attendre (fiche introuvable, adresse sans identifiant). */
  ready: "ready",
} as const
export type RecordState = (typeof RecordState)[keyof typeof RecordState]

type RecordQuery = { isPending: boolean; fetchStatus: FetchStatus }

/** Où en est une fiche d'après ses lectures ; sans identifiant, il n'y a rien à attendre. */
export function recordState(
  id: string,
  ...queries: RecordQuery[]
): RecordState {
  if (!id) return RecordState.ready
  if (queries.some(waitsForNetwork)) return RecordState.offline
  if (queries.some((query) => query.isPending)) return RecordState.loading
  return RecordState.ready
}

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

/**
 * Fiche jamais ouverte sur ce téléphone, sans réseau (D39) : on le dit au lieu de laisser tourner le
 * chargement ; elle s'affiche d'elle-même au retour du réseau.
 */
export function RecordOffline({
  listLabel,
  listHref,
}: {
  listLabel: string
  listHref: string
}) {
  const t = useTranslations("records.offline")
  return (
    <PageBody>
      <EmptyState
        illustration={
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-warning-muted text-warning-muted-foreground">
            <WifiOffIcon className="size-7" aria-hidden />
          </span>
        }
        title={t("title")}
        description={t("description")}
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
