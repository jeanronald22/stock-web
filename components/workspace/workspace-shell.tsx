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
          <SidebarInset>
            <WorkspaceHeader />
            <div className="flex flex-1 flex-col">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </StockAccessProvider>
    </WorkspaceGate>
  )
}
