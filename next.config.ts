import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  experimental: {
    // Le cache persistant du serveur de développement (.next/dev/cache) devenait incohérent après
    // un arrêt brutal et provoquait des rechargements en boucle (« HMR hash mismatch »). Mesuré :
    // 156 rechargements en 6 s avec ce cache, 2 sans. Contrepartie : première compilation plus lente.
    turbopackFileSystemCacheForDev: false,
  },
}

export default withNextIntl(nextConfig)
