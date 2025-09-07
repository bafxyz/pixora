import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  // Theme
  theme: Theme

  // Modals and dialogs
  isAuthModalOpen: boolean
  isSettingsModalOpen: boolean

  // Notifications
  notifications: Notification[]

  // Loading states
  globalLoading: boolean
  loadingStates: Record<string, boolean>

  // Sidebar/Navigation
  sidebarOpen: boolean
  mobileMenuOpen: boolean

  // Search and filters
  searchQuery: string
  activeFilters: Record<string, unknown>

  // Layout preferences
  compactMode: boolean
  showBreadcrumbs: boolean
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface UIActions {
  // Theme
  setTheme: (theme: Theme) => void

  // Modals and dialogs
  openAuthModal: () => void
  closeAuthModal: () => void
  openSettingsModal: () => void
  closeSettingsModal: () => void

  // Notifications
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void

  // Loading states
  setGlobalLoading: (loading: boolean) => void
  setLoadingState: (key: string, loading: boolean) => void

  // Sidebar/Navigation
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void

  // Search and filters
  setSearchQuery: (query: string) => void
  setActiveFilters: (filters: Record<string, unknown>) => void
  clearFilters: () => void

  // Layout preferences
  toggleCompactMode: () => void
  setCompactMode: (compact: boolean) => void
  toggleBreadcrumbs: () => void
  setShowBreadcrumbs: (show: boolean) => void
}

type UIStore = UIState & UIActions

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',
      isAuthModalOpen: false,
      isSettingsModalOpen: false,
      notifications: [],
      globalLoading: false,
      loadingStates: {},
      sidebarOpen: true,
      mobileMenuOpen: false,
      searchQuery: '',
      activeFilters: {},
      compactMode: false,
      showBreadcrumbs: true,

      // Actions
      setTheme: (theme) => set({ theme }),

      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      openSettingsModal: () => set({ isSettingsModalOpen: true }),
      closeSettingsModal: () => set({ isSettingsModalOpen: false }),

      addNotification: (notification) => {
        const id = Date.now().toString()
        const newNotification: Notification = {
          ...notification,
          id,
          duration: notification.duration ?? 5000,
        }

        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }))

        // Auto-remove notification after duration
        if (newNotification.duration && newNotification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id)
          }, newNotification.duration)
        }
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      },

      clearNotifications: () => set({ notifications: [] }),

      setGlobalLoading: (globalLoading) => set({ globalLoading }),

      setLoadingState: (key, loading) => {
        set((state) => ({
          loadingStates: {
            ...state.loadingStates,
            [key]: loading,
          },
        }))
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }))
      },

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      toggleMobileMenu: () => {
        set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen }))
      },

      setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      setActiveFilters: (activeFilters) => set({ activeFilters }),

      clearFilters: () => set({ activeFilters: {} }),

      toggleCompactMode: () => {
        set((state) => ({ compactMode: !state.compactMode }))
      },

      setCompactMode: (compactMode) => set({ compactMode }),

      toggleBreadcrumbs: () => {
        set((state) => ({ showBreadcrumbs: !state.showBreadcrumbs }))
      },

      setShowBreadcrumbs: (showBreadcrumbs) => set({ showBreadcrumbs }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        compactMode: state.compactMode,
        showBreadcrumbs: state.showBreadcrumbs,
      }),
    }
  )
)

// Selectors for commonly used state
export const useTheme = () => useUIStore((state) => state.theme)
export const useNotifications = () => useUIStore((state) => state.notifications)
export const useIsLoading = (key?: string) =>
  useUIStore((state) =>
    key ? (state.loadingStates[key] ?? false) : state.globalLoading
  )

// Helper hooks for theme management
export const useResolvedTheme = () => {
  const theme = useTheme()

  // In a real app, you'd detect system preference here
  // For now, we'll just return the theme as-is
  return theme === 'system' ? 'light' : theme
}

// Notification helpers
export const useNotify = () => {
  const addNotification = useUIStore((state) => state.addNotification)

  return {
    success: (title: string, message?: string) =>
      addNotification({ type: 'success', title, message }),
    error: (title: string, message?: string) =>
      addNotification({ type: 'error', title, message }),
    warning: (title: string, message?: string) =>
      addNotification({ type: 'warning', title, message }),
    info: (title: string, message?: string) =>
      addNotification({ type: 'info', title, message }),
  }
}
