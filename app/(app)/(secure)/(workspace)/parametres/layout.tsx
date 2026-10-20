import { SettingsShell } from "@/components/settings/settings-shell"

/** Paramètres (D45) : titre et onglets communs, chaque onglet son écran. */
export default function SettingsLayout({
  children,
}: LayoutProps<"/parametres">) {
  return <SettingsShell>{children}</SettingsShell>
}
