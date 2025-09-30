import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import {
  logAuthError,
  logAuthWarning,
  logSessionRefresh,
} from '@/shared/lib/auth/logging'

/**
 * Creates a Supabase client with proper cookie handling for middleware
 */
export function createSupabaseClient(
  request: NextRequest,
  response: NextResponse
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        } catch (error) {
          console.error('Failed to set cookies:', error)
        }
      },
    },
  })
}

/**
 * Safely gets the authenticated user with session refresh capability
 */
export async function getAuthUser(
  request: NextRequest,
  supabaseUrl: string,
  supabaseAnonKey: string
) {
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name }) => {
          console.log(`Cookie to be set: ${name}`)
        })
      },
    },
  })

  try {
    const {
      data: { user: authUser },
      error: getUserError,
    } = await supabase.auth.getUser()

    if (getUserError) {
      logAuthWarning('Error getting user, attempting session refresh', {
        error: getUserError.message,
        code: getUserError.code,
        status: getUserError.status,
        path: request.nextUrl.pathname,
        timestamp: new Date().toISOString(),
        details: {
          method: 'getUser',
          step: 'initial',
        },
      })

      const { error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError) {
        logSessionRefresh('failed', {
          error: refreshError.message,
          code: refreshError.code,
          status: refreshError.status,
          path: request.nextUrl.pathname,
          timestamp: new Date().toISOString(),
          details: {
            method: 'refreshSession',
            step: 'refresh_attempt',
          },
        })
        return { user: null }
      } else {
        logSessionRefresh('success', {
          path: request.nextUrl.pathname,
          timestamp: new Date().toISOString(),
          details: {
            method: 'refreshSession',
            step: 'refresh_success',
          },
        })

        const {
          data: { user: refreshedUser },
          error: secondGetError,
        } = await supabase.auth.getUser()
        if (secondGetError) {
          logAuthError('Error getting user after refresh', {
            error: secondGetError.message,
            code: secondGetError.code,
            status: secondGetError.status,
            path: request.nextUrl.pathname,
            timestamp: new Date().toISOString(),
            details: {
              method: 'getUser',
              step: 'post_refresh',
            },
          })
          return { user: null }
        } else {
          return { user: refreshedUser }
        }
      }
    } else {
      return { user: authUser }
    }
  } catch (error) {
    logAuthError('Unexpected error getting or refreshing user', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: request.nextUrl.pathname,
      timestamp: new Date().toISOString(),
      details: {
        method: 'getAuthUser',
        step: 'catch_block',
      },
    })
    return { user: null }
  }
}

/**
 * Validates environment variables for middleware
 */
export function validateEnvironment() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      isValid: false,
      error: 'Missing Supabase configuration',
      details: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
      },
    }
  }

  return { isValid: true }
}

/**
 * Checks if a path is public (doesn't require authentication)
 */
export function isPublicPath(pathname: string): boolean {
  const publicRoutes = ['/session']
  return publicRoutes.some((route) => pathname.startsWith(route))
}

/**
 * Checks if a path is protected (requires authentication)
 */
export function isProtectedPath(pathname: string): boolean {
  const protectedRoutes = ['/photographer', '/admin', '/studio-admin']
  return protectedRoutes.some((route) => pathname.startsWith(route))
}

/**
 * Checks if a path is an authentication route
 */
export function isAuthPath(pathname: string): boolean {
  const authRoutes = ['/login']
  return authRoutes.some((route) => pathname.startsWith(route))
}

/**
 * Validates API route access based on user role
 */
export function validateApiAccess(
  pathname: string,
  userRole: string
): {
  hasAccess: boolean
  error?: string
} {
  // Admin API endpoints
  if (pathname.startsWith('/api/admin/')) {
    if (userRole !== 'admin') {
      return { hasAccess: false, error: 'Forbidden: Admin access required' }
    }
  }

  // Studio admin API endpoints
  if (pathname.startsWith('/api/studio-admin/')) {
    if (!['studio-admin', 'admin'].includes(userRole)) {
      return {
        hasAccess: false,
        error: 'Forbidden: Studio admin access required',
      }
    }
  }

  // Photographer API endpoints
  if (
    pathname.startsWith('/api/photographer/') ||
    pathname.startsWith('/api/qr/')
  ) {
    if (!['photographer', 'studio-admin', 'admin'].includes(userRole)) {
      return {
        hasAccess: false,
        error: 'Forbidden: Photographer access required',
      }
    }
  }

  // Photos and payments endpoints
  if (
    pathname.startsWith('/api/photos/') ||
    pathname.startsWith('/api/payments/')
  ) {
    if (!userRole) {
      return { hasAccess: false, error: 'Unauthorized: Please login' }
    }
  }

  // Auth and session endpoints are public
  if (
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/session/')
  ) {
    return { hasAccess: true }
  }

  return { hasAccess: true }
}
