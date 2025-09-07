/**
 * Environment configuration with type safety
 */

// Get environment variables with fallbacks
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const env = {
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Photography Gallery',
  },
  features: {
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  },
} as const

// Validate required environment variables in development
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn(
      '⚠️  Missing NEXT_PUBLIC_SUPABASE_URL - using placeholder value'
    )
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn(
      '⚠️  Missing NEXT_PUBLIC_SUPABASE_ANON_KEY - using placeholder value'
    )
  }
}

export type EnvConfig = typeof env
