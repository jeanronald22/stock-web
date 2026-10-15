import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import { NextIntlClientProvider } from "next-intl"
import { getLocale } from "next-intl/server"

import "./globals.css"
import { ServiceWorker } from "@/components/offline/service-worker"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  // Absolute URLs for Open Graph images; set per environment.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100"
  ),
  title: { default: "Kreskala Stock", template: "%s · Kreskala" },
  description: "Votre stock, au carton près.",
  applicationName: "Kreskala",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
}

/** Hauteur de la barre du haut (WorkspaceHeader, h-16) plus un léger écart. */
const TOASTS_BELOW_HEADER_PX = 72

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <NextIntlClientProvider>
          <ThemeProvider>
            <ServiceWorker>{children}</ServiceWorker>
            {/* Téléphone : sous la barre du haut (64 px), pour ne jamais cacher le menu ni l'entreprise. */}
            <Toaster
              position="top-center"
              richColors
              mobileOffset={{ top: TOASTS_BELOW_HEADER_PX }}
            />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
