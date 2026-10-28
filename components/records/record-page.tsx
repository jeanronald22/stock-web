"use client"

import { Fragment, Suspense, type ReactNode } from "react"

import { useRecordId } from "./use-record-id"

/**
 * Page d'une fiche lue dans l'adresse (RecordRoutes, D39). Une autre fiche remonte l'écran à neuf,
 * comme une autre page : rien ne passe de l'une à l'autre (onglet ouvert, saisie en cours).
 */
export function RecordPage({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <KeyedById>{children}</KeyedById>
    </Suspense>
  )
}

function KeyedById({ children }: { children: ReactNode }) {
  return <Fragment key={useRecordId()}>{children}</Fragment>
}
