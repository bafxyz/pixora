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
    console.error('Missing Supabase environment variables in multi-tenant middleware')
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
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // Если пользователь не авторизован, перенаправляем на логин
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Получаем client_id пользователя из его профиля или из JWT
  const user = session.user
  const clientId = user.user_metadata?.client_id || user.id

  if (!clientId) {
    // Если у пользователя нет client_id, перенаправляем на страницу настройки
    return NextResponse.redirect(new URL('/setup', request.url))
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
