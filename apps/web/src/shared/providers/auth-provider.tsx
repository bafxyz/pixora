'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/shared/stores/auth.store'

interface Props {
  children: React.ReactNode
}

export function AuthProvider({ children }: Props) {
  const { loading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        children
      )}
    </>
  )
}

// Export useAuth hook for backward compatibility
export const useAuth = () => {
  const { user, loading, signOut } = useAuthStore()
  return { user, loading, signOut }
}
