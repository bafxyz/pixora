/**
 * Environment configuration with type safety
 */

// Get environment variables with proper validation
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate required environment variables
const validateEnv = () => {
  const errors: string[] = []

  if (!SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  }

  if (!SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  if (errors.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Environment validation failed: ${errors.join(', ')}`)
    } else {
      console.warn('⚠️  Missing required environment variables:')
      errors.forEach((error) => {
        console.warn(`  - ${error}`)
      })
    }
  }
}

// Run validation
validateEnv()

export const env = {
  supabase: {
    url: SUPABASE_URL || 'https://placeholder.supabase.co',
    anonKey: SUPABASE_ANON_KEY || 'placeholder-anon-key',
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Photography Gallery',
  },
  features: {
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  },
} as const

export type EnvConfig = typeof env
