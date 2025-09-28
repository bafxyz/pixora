/**
 * Authentication logging utilities
 * Provides centralized logging functionality for authentication events
 */

interface AuthLogData {
  path?: string
  timestamp: string
  userId?: string
  email?: string
  role?: string
  error?: string
  code?: string
  status?: number
  details?: Record<string, unknown>
}

/**
 * Log authentication events with consistent structure
 */
export function logAuthEvent(
  level: 'info' | 'warn' | 'error',
  message: string,
  data: AuthLogData
): void {
  const logObject = {
    event: 'auth',
    level,
    message,
    ...data,
  }

  switch (level) {
    case 'info':
      console.info(`[AUTH-${level.toUpperCase()}]`, logObject)
      break
    case 'warn':
      console.warn(`[AUTH-${level.toUpperCase()}]`, logObject)
      break
    case 'error':
      console.error(`[AUTH-${level.toUpperCase()}]`, logObject)
      break
    default:
      // Handle unexpected log levels
      console.log(`[AUTH-UNKNOWN]`, logObject)
      break
  }
}

/**
 * Log successful authentication events
 */
export function logAuthSuccess(
  message: string,
  data: Omit<AuthLogData, 'error'>
): void {
  logAuthEvent('info', message, data)
}

/**
 * Log authentication warnings
 */
export function logAuthWarning(message: string, data: AuthLogData): void {
  logAuthEvent('warn', message, data)
}

/**
 * Log authentication errors
 */
export function logAuthError(
  message: string,
  data: Omit<AuthLogData, 'level'>
): void {
  logAuthEvent('error', message, data)
}

/**
 * Log session refresh events
 */
export function logSessionRefresh(
  status: 'success' | 'failed',
  data: AuthLogData
): void {
  const message =
    status === 'success'
      ? 'Session refresh successful'
      : 'Session refresh failed'

  logAuthEvent(status === 'success' ? 'info' : 'warn', message, data)
}

/**
 * Log user authentication status
 */
export function logUserAuthStatus(
  userId: string | null,
  path: string,
  isAuthenticated: boolean
): void {
  if (isAuthenticated && userId) {
    logAuthSuccess('User authenticated and authorized', {
      userId,
      path,
      timestamp: new Date().toISOString(),
      details: { isAuthenticated },
    })
  } else {
    logAuthWarning('User not authenticated', {
      userId: userId || 'unknown',
      path,
      timestamp: new Date().toISOString(),
      details: { isAuthenticated },
    })
  }
}
