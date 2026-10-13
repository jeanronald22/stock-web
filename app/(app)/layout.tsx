import { AppProviders } from "@/components/providers/app-providers"

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppProviders>{children}</AppProviders>
}
