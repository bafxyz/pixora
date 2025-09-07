export type User = {
  id: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  studioName?: string
  role?: 'photographer' | 'admin' | 'guest' | 'super-admin'
}

export type LoginCredentials = {
  email: string
  password: string
}

export type RegisterCredentials = {
  email: string
  password: string
  firstName: string
  lastName: string
  studioName: string
}

export type AuthState = {
  user: User | null
  isLoading: boolean
  error: string | null
}
