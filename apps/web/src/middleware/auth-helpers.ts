import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import {
  logAuthError,
  logAuthWarning,
  logSessionRefresh,
} from '../shared/lib/auth/logging'

/**
 * Safely gets the authenticated user with session refresh capability
 * @param request - The Next.js request object
 * @param supabaseUrl - Supabase URL from environment
 * @param supabaseAnonKey - Supabase anon key from environment
 * @returns User object or null if not authenticated
 */
export async function getAuthUser(
  request: NextRequest,
  supabaseUrl: string,
  supabaseAnonKey: string
) {
  // Create Supabase client
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll() {
        // Note: We don't set cookies here to avoid modifying the request during middleware
        // This is handled by the main middleware response handling
      },
    },
  })

  try {
    // First, try to get the user with the current session
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

      // If there's an error getting the user, try to refresh the session
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

        // After successful refresh, try to get the user again
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
      // No error, return the user
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
