import { type NextRequest, NextResponse } from 'next/server'

export interface ApiError {
  error: string
  details?: Record<string, unknown>
  code?: string
  status: number
}

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

export function handleApiError(
  error: Error & { status?: number; code?: string },
  context?: string,
  request?: NextRequest
): NextResponse {
  // Log the error with context
  console.error(`API Error in ${context || 'unknown context'}:`, {
    message: error.message,
    stack: error.stack,
    url: request?.url,
    timestamp: new Date().toISOString(),
  })

  // Determine error type and return appropriate status
  if (error.status && error.status >= 400 && error.status < 600) {
    return NextResponse.json(
      {
        error: error.message || 'An error occurred',
        ...(error.code && { code: error.code }),
      },
      { status: error.status }
    )
  }

  // Default to 500 for unexpected errors
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message || 'Internal server error'

  return NextResponse.json(
    { error: message, code: 'INTERNAL_ERROR' },
    { status: 500 }
  )
}

export function withApiHandler(
  handler: (request: NextRequest) => Promise<NextResponse>,
  context?: string
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request)
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      return handleApiError(errorObj, context || handler.name, request)
    }
  }
}

export const ApiErrors = {
  unauthorized: (
    message = 'Unauthorized: Please login to access this resource'
  ) => createApiError(message, 401, undefined, 'UNAUTHORIZED'),

  forbidden: (
    message = 'Forbidden: You do not have permission to access this resource'
  ) => createApiError(message, 403, undefined, 'FORBIDDEN'),

  notFound: (message = 'Resource not found') =>
    createApiError(message, 404, undefined, 'NOT_FOUND'),

  badRequest: (message = 'Bad request', details?: Record<string, unknown>) =>
    createApiError(message, 400, details, 'BAD_REQUEST'),

  rateLimit: (message = 'Rate limit exceeded', retryAfter?: number) => {
    const error = createApiError(message, 429, undefined, 'RATE_LIMIT')
    return { error, retryAfter }
  },

  validation: (message: string, details?: Record<string, unknown>) =>
    createApiError(message, 400, details, 'VALIDATION_ERROR'),

  internalError: (message = 'Internal server error') =>
    createApiError(message, 500, undefined, 'INTERNAL_ERROR'),
}
