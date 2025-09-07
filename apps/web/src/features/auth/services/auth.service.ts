import { env } from '@/shared/config/env'
import type { LoginCredentials, RegisterCredentials, User } from '../types'

class AuthError extends Error {
  errorType: string

  constructor(message: string, errorType: string) {
    super(message)
    this.errorType = errorType
    this.name = 'AuthError'
  }
}

const API_BASE_URL = `${env.supabase.url}/functions/v1/make-server-2e5a4e91`

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${env.supabase.anonKey}`,
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify(credentials),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Login failed')
    }

    return result.user
  },

  async register(credentials: RegisterCredentials): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/register-photographer`, {
      method: 'POST',
      headers,
      body: JSON.stringify(credentials),
    })

    const result = await response.json()

    if (!response.ok) {
      if (result.errorType === 'user_exists') {
        throw new AuthError(
          result.error || 'User already exists',
          'user_exists'
        )
      }
      throw new Error(result.error || 'Registration failed')
    }

    // Auto-login after registration
    return this.login({
      email: credentials.email,
      password: credentials.password,
    })
  },

  async logout(): Promise<void> {
    try {
      // Call our logout API route
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Logout failed')
      }

      // Clear any local storage (if needed for legacy reasons)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear local storage even if API call fails
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
      }
      throw error
    }
  },

  async getCurrentUser(): Promise<User | null> {
    // Implement get current user logic
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    }
    return null
  },
}
