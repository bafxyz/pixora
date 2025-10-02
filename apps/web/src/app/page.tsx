import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/shared/lib/auth/role-guard'
import { getRoleRedirectPath } from '@/shared/lib/auth/role-redirect'

export default async function Home() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    redirect('/login')
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Ignore errors in server components
        }
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const userRole = (user.user_metadata?.role || 'photographer') as UserRole
    const redirectPath = getRoleRedirectPath(userRole)
    redirect(redirectPath)
  }

  // If not authenticated, redirect to login
  redirect('/login')
}
