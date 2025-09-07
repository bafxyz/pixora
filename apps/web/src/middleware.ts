import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { multiTenantMiddleware } from './middleware/multi-tenant'

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
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          void request.cookies.set(name, value)
        })
        response = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          void response.cookies.set(name, value, options)
        })
      },
    },
  })

  let user = null
  try {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser()
    if (error) {
      console.error('Middleware: Error getting user', {
        error: error.message,
        path: request.nextUrl.pathname,
        timestamp: new Date().toISOString(),
      })
    }
    user = authUser
  } catch (error) {
    console.error('Middleware: Unexpected error getting user', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: request.nextUrl.pathname,
      timestamp: new Date().toISOString(),
    })
  }

  // Protected routes that require authentication
  const protectedRoutes = [
    '/photographer',
    '/admin',
    '/super-admin',
    '/dashboard',
  ]
  const authRoutes = ['/login']
  const publicRoutes = ['/', '/gallery']

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )
  const _isPublicRoute = publicRoutes.some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith('/gallery/')
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
    // Определяем роль пользователя и перенаправляем соответственно
    const userRole = user.user_metadata?.role || 'photographer'
    const userId = user.id

    // Определяем путь редиректа в зависимости от роли
    let redirectPath = '/dashboard' // По умолчанию на dashboard

    switch (userRole) {
      case 'admin':
        redirectPath = '/admin'
        break
      case 'photographer':
        redirectPath = '/photographer'
        break
      case 'guest':
        redirectPath = '/gallery'
        break
      case 'super-admin':
        redirectPath = '/super-admin'
        break
      default:
        redirectPath = '/dashboard'
    }

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

  // If user is already on the correct page for their role, don't redirect
  if (user && isProtectedRoute) {
    const userRole = user.user_metadata?.role || 'photographer'
    const currentPath = request.nextUrl.pathname

    // Check if user is already on their designated page
    const isOnCorrectPage =
      (userRole === 'admin' && currentPath.startsWith('/admin')) ||
      (userRole === 'photographer' &&
        currentPath.startsWith('/photographer')) ||
      (userRole === 'guest' && currentPath.startsWith('/gallery')) ||
      (userRole === 'super-admin' && currentPath.startsWith('/super-admin')) ||
      currentPath.startsWith('/dashboard')

    if (isOnCorrectPage) {
      // User is on correct page, continue without redirect
      if (
        userRole === 'photographer' &&
        currentPath.startsWith('/photographer')
      ) {
        return await multiTenantMiddleware(request)
      }
      return response
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
