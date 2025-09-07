'use client'

import { useRouter } from 'next/navigation'
import { LoginPage } from '@/features/auth/components/login-page'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  studioName?: string
}

export default function Login() {
  const router = useRouter()

  const handleLogin = (_user: User) => {
    // In a real app, you'd handle authentication here

    router.push('/dashboard')
  }

  const handleGuestAccess = (_guestId: string) => {
    // In a real app, you'd handle guest access here

    router.push('/gallery')
  }

  return <LoginPage onLogin={handleLogin} onGuestAccess={handleGuestAccess} />
}
