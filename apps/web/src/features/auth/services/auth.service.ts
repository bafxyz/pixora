import type { LoginCredentials, RegisterCredentials } from '../types'

export interface User {
  id: string
  email: string
  name?: string
  role?: 'photographer' | 'admin' | 'guest' | 'super-admin'
}

class AuthError extends Error {
  errorType: string

  constructor(message: string, errorType: string) {
    super(message)
    this.errorType = errorType
    this.name = 'AuthError'
  }
}

const headers = {
  'Content-Type': 'application/json',
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await fetch('/api/auth/login', {
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
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        studioName: credentials.studioName,
      }),
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
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  },
}
