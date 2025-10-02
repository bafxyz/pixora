export const runtime = 'nodejs'

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from './middleware/auth-helpers'
import { multiTenantMiddleware } from './middleware/multi-tenant'

// Simple role-based access control
const PROTECTED_ROUTES = {
  '/api/admin/': ['admin'],
  '/api/studio-admin/': ['studio-admin', 'admin'],
  '/api/photographer/': ['photographer', 'studio-admin', 'admin'],
  '/admin/': ['admin'],
  '/studio-admin/': ['studio-admin', 'admin'],
  '/photographer/': ['photographer', 'studio-admin', 'admin'],
}

function checkRouteAccess(path: string, userRole: string): boolean {
  for (const [routePath, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (path.startsWith(routePath)) {
      return allowedRoles.includes(userRole)
    }
  }
  return true // Public route
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    return NextResponse.json(
      { error: 'Internal server error: Missing Supabase configuration' },
      { status: 500 }
    )
  }

  const path = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/session', '/login', '/api/auth/login']
  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Get authenticated user
  const { user } = await getAuthUser(request, supabaseUrl, supabaseAnonKey)

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', path)
    return NextResponse.redirect(loginUrl)
  }

  const userRole = user.user_metadata?.role || 'photographer'

  // Check route access
  if (!checkRouteAccess(path, userRole)) {
    console.warn(
      `Unauthorized access attempt to ${path} by ${user.email} with role ${userRole}`
    )
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    )
  }

  // Handle multi-tenant middleware for protected routes
  if (
    path.startsWith('/api/') ||
    path.startsWith('/photographer/') ||
    path.startsWith('/studio-admin/')
  ) {
    return multiTenantMiddleware(request)
  }

  // Create response with proper cookie handling
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
