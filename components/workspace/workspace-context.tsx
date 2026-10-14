"use client"

import { createContext, use } from "react"

import type { Organization, User } from "@/lib/api/platform"

export type Workspace = {
  user: User
  organization: Organization
  organizations: Organization[]
}

export const WorkspaceContext = createContext<Workspace | null>(null)

/** Personne connectée et entreprise active, garanties sous WorkspaceShell. */
export function useWorkspace(): Workspace {
  const workspace = use(WorkspaceContext)
  if (!workspace)
    throw new Error("useWorkspace doit être utilisé sous WorkspaceShell")
  return workspace
}
