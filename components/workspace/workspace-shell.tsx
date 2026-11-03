"use client"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { AppSidebar } from "./app-sidebar"
import { StockAccessProvider } from "./stock-access"
import { WorkspaceGate } from "./workspace-gate"
import { WorkspaceHeader } from "./workspace-header"

/** Cadre des écrans de travail : barre latérale, en-tête, entreprise active. */
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceGate>
      <StockAccessProvider>
        <SidebarProvider>
          <AppSidebar />
          {/* Sans min-w-0, un contenu large (bandeau, tableau) élargirait la page au lieu de passer à la ligne. */}
          <SidebarInset className="min-w-0">
            <WorkspaceHeader />
            <div className="flex flex-1 flex-col">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </StockAccessProvider>
    </WorkspaceGate>
  )
}
