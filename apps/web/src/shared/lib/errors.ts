/**
 * Custom Application Errors
 * Provides specific error types for different scenarios in the application
 */

export class AppError extends Error {
  public readonly code: string
  public readonly status: number
  public readonly details?: Record<string, unknown>

  constructor(
    message: string,
    code: string,
    status: number,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
    this.details = details

    // Set the prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

// Specific error types
export class AuthenticationError extends AppError {
  constructor(
    message = 'Authentication failed',
    details?: Record<string, unknown>
  ) {
    super(message, 'AUTH_ERROR', 401, details)
    this.name = 'AuthenticationError'
    Object.setPrototypeOf(this, AuthenticationError.prototype)
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message = 'Authorization failed',
    details?: Record<string, unknown>
  ) {
    super(message, 'AUTHZ_ERROR', 403, details)
    this.name = 'AuthorizationError'
    Object.setPrototypeOf(this, AuthorizationError.prototype)
  }
}

export class ValidationError extends AppError {
  constructor(
    message = 'Validation failed',
    details?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class NotFoundError extends AppError {
  constructor(
    message = 'Resource not found',
    details?: Record<string, unknown>
  ) {
    super(message, 'NOT_FOUND_ERROR', 404, details)
    this.name = 'NotFoundError'
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

export class DatabaseError extends AppError {
  constructor(
    message = 'Database error occurred',
    details?: Record<string, unknown>
  ) {
    super(message, 'DATABASE_ERROR', 500, details)
    this.name = 'DatabaseError'
    Object.setPrototypeOf(this, DatabaseError.prototype)
  }
}

export class NetworkError extends AppError {
  constructor(
    message = 'Network error occurred',
    details?: Record<string, unknown>
  ) {
    super(message, 'NETWORK_ERROR', 502, details)
    this.name = 'NetworkError'
    Object.setPrototypeOf(this, NetworkError.prototype)
  }
}

/**
 * Type guard functions to check error types
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function isAuthError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError
}

export function isAuthzError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError
}
