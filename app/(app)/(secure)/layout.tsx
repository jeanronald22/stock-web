import { SessionGate } from "@/components/app/session-gate"

export default function SecureLayout({ children }: LayoutProps<"/">) {
  return <SessionGate>{children}</SessionGate>
}
