/**
 * API Error Handler
 * Provides consistent error responses for API routes
 */

export interface ApiError {
  error: string
  details?: Record<string, unknown>
  code?: string
  status: number
}

/**
 * Creates a standardized API error response
 */
export function createApiError(
  message: string,
  status: number,
  details?: Record<string, unknown>,
  code?: string
): ApiError {
  return {
    error: message,
    status,
    ...(details && { details }),
    ...(code && { code }),
  }
}

/**
 * Handles API errors and returns appropriate response
 */
export function handleApiError(
  error: Error & { status?: number; code?: string },
  context?: string
): Response {
  // Log the error with context
  console.error(`API Error in ${context || 'unknown context'}:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  })

  // Determine error type and return appropriate status
  if (error.status && error.status >= 400 && error.status < 600) {
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred',
        status: error.status,
      }),
      {
        status: error.status,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // Default to 500 for unexpected errors
  return new Response(
    JSON.stringify({
      error: error.message || 'Internal server error',
      status: 500,
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

/**
 * Async handler wrapper for API routes
 * Wraps API route handlers to provide consistent error handling
 */
export function withApiHandler<
  T extends (...args: unknown[]) => Promise<unknown>,
>(handler: T): (...args: Parameters<T>) => Promise<unknown> {
  return async (...args: Parameters<T>): Promise<unknown> => {
    try {
      return await handler(...args)
    } catch (error: unknown) {
      // This function will be called from an API route context, so we return a response
      const errorObj = error instanceof Error ? error : new Error(String(error))
      return handleApiError(errorObj, handler.name || 'unknown handler')
    }
  }
}

/**
 * Specific error responses for common scenarios
 */
export const ApiErrors = {
  unauthorized: (
    message = 'Unauthorized: Please login to access this resource'
  ) => createApiError(message, 401),

  forbidden: (
    message = 'Forbidden: You do not have permission to access this resource'
  ) => createApiError(message, 403),

  notFound: (message = 'Resource not found') => createApiError(message, 404),

  badRequest: (message = 'Bad request') => createApiError(message, 400),

  internalError: (message = 'Internal server error') =>
    createApiError(message, 500),
}
