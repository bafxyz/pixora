import type {
  AuthChangeEvent,
  AuthError,
  Session,
  User as SupabaseUser,
} from '@supabase/supabase-js'
import { create } from 'zustand'
import type { User } from '@/features/auth/types'
import { createClient } from '@/shared/lib/supabase/client'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
  supabaseUser: SupabaseUser | null
}

interface AuthActions {
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>((set, _get) => {
  const supabase = createClient()

  return {
    // Initial state
    user: null,
    session: null,
    supabaseUser: null,
    loading: true,
    initialized: false,

    // Actions
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setLoading: (loading) => set({ loading }),
    setInitialized: (initialized) => set({ initialized }),

    signIn: async (email: string, password: string) => {
      set({ loading: true })
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        return { error }
      } finally {
        set({ loading: false })
      }
    },

    signUp: async (email: string, password: string) => {
      set({ loading: true })
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        return { error }
      } finally {
        set({ loading: false })
      }
    },

    signOut: async () => {
      set({ loading: true })
      try {
        await supabase.auth.signOut()
      } finally {
        set({ loading: false })
      }
    },

    initialize: async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)
        }

        const user = session?.user
          ? {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name,
              role: session.user.user_metadata?.role || 'photographer',
            }
          : null

        console.log('Auth store re-initialized:', { user, session: !!session })

        set({
          session,
          user,
          supabaseUser: session?.user ?? null,
          loading: false,
          initialized: true,
        })

        // Listen for auth state changes
        const {
          data: { subscription: _subscription },
        } = supabase.auth.onAuthStateChange(
          (_event: AuthChangeEvent, session) => {
            const user = session?.user
              ? {
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.user_metadata?.name,
                  role: session.user.user_metadata?.role || 'photographer',
                }
              : null

            set({
              session,
              user,
              supabaseUser: session?.user ?? null,
              loading: false,
            })
          }
        )

        // Store cleanup function for later use
        // Note: In a real app, you'd want to handle cleanup properly
        // For now, we'll just set up the listener
      } catch (error) {
        console.error('Auth initialization error:', error)
        set({ loading: false, initialized: true })
      }
    },
  }
})

// Selectors for commonly used state
export const useAuthUser = () => useAuthStore((state) => state.user)
export const useAuthSession = () => useAuthStore((state) => state.session)
export const useAuthLoading = () => useAuthStore((state) => state.loading)
export const useAuthInitialized = () =>
  useAuthStore((state) => state.initialized)
