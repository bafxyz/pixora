export const runtime = 'nodejs'

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from './middleware/auth-helpers'
import { multiTenantMiddleware } from './middleware/multi-tenant'
import { logUserAuthStatus } from './shared/lib/auth/logging'
import type { UserRole } from './shared/lib/auth/role-guard'
import {
  canAccessPath,
  getRoleRedirectPath,
} from './shared/lib/auth/role-redirect'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Middleware: Missing Supabase environment variables', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      path: request.nextUrl.pathname,
      timestamp: new Date().toISOString(),
    })
    // Return 500 error for server misconfiguration
    return NextResponse.json(
      { error: 'Internal server error: Missing Supabase configuration' },
      { status: 500 }
    )
  }

  // Get authenticated user with session refresh capability
  const { user } = await getAuthUser(request, supabaseUrl, supabaseAnonKey)

  // Log authentication status
  logUserAuthStatus(user?.id || null, request.nextUrl.pathname, !!user)

  // Create a new Supabase client with proper cookie handling
  const _supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
          // Continue with response even if cookie setting fails
        }
      },
    },
  })

  const path = request.nextUrl.pathname
  const userRole = user?.user_metadata?.role || 'guest'

  // API Routes Protection - CRITICAL!
  if (path.startsWith('/api/')) {
    // Admin API endpoints - only admin
    if (path.startsWith('/api/admin/')) {
      if (!user || userRole !== 'admin') {
        console.warn(
          `[SECURITY] Unauthorized access attempt to ${path} by ${user?.email || 'anonymous'} with role ${userRole}`
        )
        return NextResponse.json(
          { error: 'Forbidden: Admin access required' },
          { status: 403 }
        )
      }
    }

    // Studio admin API endpoints - studio-admin and admin
    if (path.startsWith('/api/studio-admin/')) {
      if (!user || !['studio-admin', 'admin'].includes(userRole)) {
        console.warn(
          `[SECURITY] Unauthorized access attempt to ${path} by ${user?.email || 'anonymous'} with role ${userRole}`
        )
        return NextResponse.json(
          { error: 'Forbidden: Studio admin access required' },
          { status: 403 }
        )
      }
    }

    // Photographer API endpoints
    if (path.startsWith('/api/photographer/')) {
      if (
        !user ||
        !['photographer', 'studio-admin', 'admin'].includes(userRole)
      ) {
        console.warn(
          `[SECURITY] Unauthorized access attempt to ${path} by ${user?.email || 'anonymous'} with role ${userRole}`
        )
        return NextResponse.json(
          { error: 'Forbidden: Photographer access required' },
          { status: 403 }
        )
      }
    }

    // Auth endpoints - public for login/registration
    if (path.startsWith('/api/auth/')) {
      // Allow access
      return response
    }

    // QR endpoints - for photographers and admins
    if (path.startsWith('/api/qr/')) {
      if (
        !user ||
        !['photographer', 'studio-admin', 'admin'].includes(userRole)
      ) {
        return NextResponse.json(
          { error: 'Forbidden: Photographer access required' },
          { status: 403 }
        )
      }
    }

    // Photos endpoints - for authorized users
    if (path.startsWith('/api/photos/')) {
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized: Please login' },
          { status: 401 }
        )
      }
    }

    // Gallery endpoints - public for guests
    if (path.startsWith('/api/gallery/')) {
      // Allow access
      return response
    }

    // Payments endpoints - for authorized users
    if (path.startsWith('/api/payments/')) {
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized: Please login' },
          { status: 401 }
        )
      }
    }
  }

  // Protected routes that require authentication
  const protectedRoutes = [
    '/photographer',
    '/admin',
    '/studio-admin',
    '/dashboard',
  ]
  const authRoutes = ['/login']

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !user) {
    console.log('Middleware: Redirecting unauthenticated user to login', {
      path: request.nextUrl.pathname,
      redirectTo: request.nextUrl.pathname,
      timestamp: new Date().toISOString(),
    })
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users from auth routes to appropriate dashboard
  if (isAuthRoute && user) {
    // Determine user role and redirect accordingly
    const userRole = (user.user_metadata?.role || 'photographer') as UserRole
    const userId = user.id
    const redirectPath = getRoleRedirectPath(userRole)

    console.log('Middleware: Redirecting authenticated user from auth route', {
      userId,
      userRole,
      redirectPath,
      from: request.nextUrl.pathname,
      timestamp: new Date().toISOString(),
    })

    // Redirect authenticated users based on their role
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Redirect authenticated users from home page to dashboard
  if (request.nextUrl.pathname === '/' && user) {
    console.log(
      'Middleware: Redirecting authenticated user from home page to dashboard',
      {
        userId: user.id,
        userRole: user.user_metadata?.role || 'guest',
        redirectTo: '/dashboard',
        timestamp: new Date().toISOString(),
      }
    )

    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If user is already on the correct page for their role, don't redirect
  if (user && isProtectedRoute) {
    const userRole = (user.user_metadata?.role || 'photographer') as UserRole
    const currentPath = request.nextUrl.pathname

    // Check if user can access current path
    const hasAccess = canAccessPath(userRole, currentPath)

    if (hasAccess) {
      // User has access, continue without redirect
      if (
        userRole === 'photographer' &&
        currentPath.startsWith('/photographer')
      ) {
        return await multiTenantMiddleware(request)
      }
      return response
    } else {
      // User doesn't have access, redirect to their dashboard
      const redirectPath = getRoleRedirectPath(userRole)
      console.log('Middleware: Redirecting user to correct role page', {
        userId: user.id,
        userRole,
        from: currentPath,
        to: redirectPath,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - file extensions
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
