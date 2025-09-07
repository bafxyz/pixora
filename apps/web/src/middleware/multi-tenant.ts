import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function multiTenantMiddleware(request: NextRequest) {
  // Создаем Supabase клиент для middleware
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Missing Supabase environment variables in multi-tenant middleware'
    )
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

  // Получаем текущего пользователя
  let user = null
  try {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser()
    if (error) {
      console.error('Multi-tenant middleware: Error getting user', {
        error: error.message,
        path: request.nextUrl.pathname,
        timestamp: new Date().toISOString(),
      })
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
    user = authUser
  } catch (error) {
    console.error('Multi-tenant middleware: Unexpected error getting user', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: request.nextUrl.pathname,
      timestamp: new Date().toISOString(),
    })
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!user) {
    // Если пользователь не авторизован, перенаправляем на логин
    console.log(
      'Multi-tenant middleware: No user found, redirecting to login',
      {
        path: request.nextUrl.pathname,
        timestamp: new Date().toISOString(),
      }
    )
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Получаем client_id пользователя из его профиля или из JWT
  const clientId = user.user_metadata?.client_id || user.id

  if (!clientId) {
    console.error('Multi-tenant middleware: No client_id found for user', {
      userId: user.id,
      userMetadata: user.user_metadata,
      path: request.nextUrl.pathname,
      timestamp: new Date().toISOString(),
    })
    // Если у пользователя нет client_id, перенаправляем на страницу настройки
    return NextResponse.redirect(new URL('/setup', request.url))
  }

  console.log('Multi-tenant middleware: Processing user with client_id', {
    userId: user.id,
    clientId,
    path: request.nextUrl.pathname,
    timestamp: new Date().toISOString(),
  })

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
