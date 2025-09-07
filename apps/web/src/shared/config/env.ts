/**
 * Environment configuration with type safety
 */

const getEnvVar = (key: string, fallback?: string): string => {
  const value = process.env[key] || fallback
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  return value
}

export const env = {
  supabase: {
    url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  },
  app: {
    url: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    name: getEnvVar('NEXT_PUBLIC_APP_NAME', 'Photography Gallery'),
  },
  features: {
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  },
} as const

export type EnvConfig = typeof env
