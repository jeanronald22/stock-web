import { WorkspaceGate } from "@/components/workspace/workspace-gate"

/** Assistants de création : plein écran, sans barre latérale, une question par écran. */
export default function FocusLayout({ children }: LayoutProps<"/">) {
  return <WorkspaceGate>{children}</WorkspaceGate>
}
