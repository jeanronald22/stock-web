import { WorkspaceShell } from "@/components/workspace/workspace-shell"

/** Écrans de travail : barre latérale et entreprise active. */
export default function WorkspaceLayout({ children }: LayoutProps<"/">) {
  return <WorkspaceShell>{children}</WorkspaceShell>
}
