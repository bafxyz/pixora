import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { logAuthWarning, logUserAuthStatus } from '../shared/lib/auth/logging'
import { getAuthUser } from './auth-helpers'

export async function multiTenantMiddleware(request: NextRequest) {
  // Get Supabase URL and anon key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Missing Supabase environment variables in multi-tenant middleware'
    )
    return NextResponse.json(
      { error: 'Internal server error: Missing Supabase configuration' },
      { status: 500 }
    )
  }

  // Get authenticated user with session refresh capability
  const { user } = await getAuthUser(request, supabaseUrl, supabaseAnonKey)

  if (!user) {
    logAuthWarning(
      'Multi-tenant middleware: No user found after session refresh, redirecting to login',
      {
        path: request.nextUrl.pathname,
        timestamp: new Date().toISOString(),
        details: {
          method: 'multiTenantMiddleware',
          step: 'user_authentication',
        },
      }
    )
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  logUserAuthStatus(user?.id || null, request.nextUrl.pathname, !!user)

  // Create a new Supabase client with proper cookie handling
  let response = NextResponse.next({
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

  // Note: This block is redundant since we already handled the !user case above

  // Получаем client_id пользователя из его профиля или из JWT
  const clientId = user.user_metadata?.client_id || user.id

  if (!clientId) {
    console.error('Multi-tenant middleware: No client_id found for user', {
      userId: user.id,
      userMetadata: user.user_metadata,
    })
    return NextResponse.redirect(new URL('/setup', request.url))
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('Multi-tenant middleware: Processing user with client_id', {
      userId: user.id,
      clientId,
    })
  }

  // Добавляем client_id в заголовки запроса для использования в API
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-client-id', clientId)

  // Создаем новый response с обновленными заголовками
  response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  return response
}

// Функция для получения client_id из заголовков
export function getClientIdFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-client-id')
}

// Функция для получения client_id из контекста
export function getClientIdFromContext(context: {
  req?: { headers?: Record<string, string | string[]> }
}): string | null {
  return (context?.req?.headers?.['x-client-id'] as string) || null
}
