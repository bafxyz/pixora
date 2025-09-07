'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LoginPage } from '@/features/auth/components/login-page'
import { createClient } from '@/shared/lib/supabase/client'

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

  // Check if user is already logged in and redirect
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const userRole = user.user_metadata?.role || 'photographer'

        // Redirect based on role
        switch (userRole) {
          case 'admin':
            router.push('/admin')
            break
          case 'photographer':
            router.push('/photographer')
            break
          case 'guest':
            router.push('/gallery')
            break
          case 'super-admin':
            router.push('/super-admin')
            break
          default:
            router.push('/dashboard')
        }
      }
    }

    checkAuth()
  }, [router])

  const handleLogin = async (user: User) => {
    // Get the actual user role from the response
    const userRole = user.role || 'photographer'

    // Redirect based on role immediately
    switch (userRole) {
      case 'admin':
        router.push('/admin')
        break
      case 'photographer':
        router.push('/photographer')
        break
      case 'guest':
        router.push('/gallery')
        break
      case 'super-admin':
        router.push('/super-admin')
        break
      default:
        router.push('/dashboard')
    }
  }

  const handleGuestAccess = (_guestId: string) => {
    router.push('/gallery')
  }

  return <LoginPage onLogin={handleLogin} onGuestAccess={handleGuestAccess} />
}
