import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import { NextIntlClientProvider } from "next-intl"
import { getLocale } from "next-intl/server"

import "./globals.css"
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
            {children}
            <Toaster position="top-center" richColors />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
