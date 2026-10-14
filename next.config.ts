import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  // Le badge de développement (« N ») couvre le lien « Retour » de la barre d'action sur téléphone.
  devIndicators: false,
  experimental: {
    // Le cache persistant du serveur de développement (.next/dev/cache) devenait incohérent après
    // un arrêt brutal et provoquait des rechargements en boucle (« HMR hash mismatch »). Mesuré :
    // 156 rechargements en 6 s avec ce cache, 2 sans. Contrepartie : première compilation plus lente.
    turbopackFileSystemCacheForDev: false,
  },
}

export default withNextIntl(nextConfig)
