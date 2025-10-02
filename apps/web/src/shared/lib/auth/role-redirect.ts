import type { UserRole } from './role-guard'

/**
 * Returns redirect path based on user role
 * @param role User role
 * @returns Redirect path
 */
export function getRoleRedirectPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'studio-admin':
      return '/studio-admin'
    case 'photographer':
      return '/photographer'
    case 'guest':
      return '/session'
    default:
      return '/photographer'
  }
}

/**
 * Checks if user with given role can access specified path
 * @param userRole User role
 * @param Path to check
 * @returns true if access is allowed
 */
export function canAccessPath(userRole: UserRole, path: string): boolean {
  // Admin has access to all paths
  if (userRole === 'admin') {
    return true
  }

  // Public paths are accessible to everyone
  const publicPaths = ['/', '/login', '/session', '/payment']

  if (publicPaths.some((publicPath) => path.startsWith(publicPath))) {
    return true
  }

  // Check access to specific paths by roles
  switch (userRole) {
    case 'studio-admin':
      return (
        path.startsWith('/studio-admin') || path.startsWith('/photographer')
      )
    case 'photographer':
      return path.startsWith('/photographer')
    case 'guest':
      return path.startsWith('/session')
    default:
      return path.startsWith('/photographer')
  }
}

/**
 * Returns role display name for user
 * @param role User role
 * @returns Localized role name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Platform Administrator'
    case 'studio-admin':
      return 'Studio Administrator'
    case 'photographer':
      return 'Photographer'
    case 'guest':
      return 'Guest'
    default:
      return 'User'
  }
}
