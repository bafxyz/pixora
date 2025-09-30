'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LoginPage } from '@/features/auth/components/login-page'
import type { UserRole } from '@/shared/lib/auth/role-guard'
import { getRoleRedirectPath } from '@/shared/lib/auth/role-redirect'
import { createClient } from '@/shared/lib/supabase/client'
import { useAuthStore } from '@/shared/stores/auth.store'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  studioName?: string
  role?: string
}

export default function Login() {
  const router = useRouter()
  const { initialize } = useAuthStore()

  // Check if user is already logged in and redirect
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const userRole = (user.user_metadata?.role ||
          'photographer') as UserRole
        const redirectPath = getRoleRedirectPath(userRole)
        router.push(redirectPath)
      }
    }

    checkAuth()
  }, [router])

  const handleLogin = async (user: User) => {
    // Force re-initialize auth store to get fresh data
    await initialize()

    // Small delay to ensure state is updated
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Get the actual user role from the response
    const userRole = (user.role || 'photographer') as UserRole
    const redirectPath = getRoleRedirectPath(userRole)
    router.push(redirectPath)
  }

  const handleGuestAccess = (sessionId: string) => {
    router.push(`/session/${encodeURIComponent(sessionId)}`)
  }

  return <LoginPage onLogin={handleLogin} onGuestAccess={handleGuestAccess} />
}
