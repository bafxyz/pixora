import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['http://localhost:3000'],
  experimental: {
    swcPlugins: [
      [
        '@lingui/swc-plugin',
        {
          // Optional plugin configuration
        },
      ],
    ],
  },
}

export default nextConfig
