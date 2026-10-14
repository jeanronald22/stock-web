"use client"

import { usePathname } from "next/navigation"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Routes } from "@/lib/routes"

import { AppSidebar } from "./app-sidebar"
import { StockAccessProvider } from "./stock-access"
import { WorkspaceGate } from "./workspace-gate"
import { WorkspaceHeader } from "./workspace-header"

/** Cadre des écrans de travail : barre latérale, en-tête, entreprise active. */
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  // L'équipe se gère sans rôle Stock : un administrateur peut n'avoir aucun accès au stock.
  const gated = !usePathname().startsWith(Routes.team)
  return (
    <WorkspaceGate>
      <StockAccessProvider gated={gated}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <WorkspaceHeader />
            <div className="flex flex-1 flex-col">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </StockAccessProvider>
    </WorkspaceGate>
  )
}
