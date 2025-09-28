import { type NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/shared/lib/api-error-handler'

/**
 * Base API route class with standardized error handling, logging, and response formatting
 */
export abstract class BaseAPIRoute {
  protected abstract handler(
    request: NextRequest,
    context?: Record<string, unknown>
  ): Promise<NextResponse>

  /**
   * Main route handler with standardized error handling and logging
   */
  public async handle(
    request: NextRequest,
    context?: Record<string, unknown>
  ): Promise<NextResponse> {
    try {
      // Add request ID for tracing
      const requestId = this.generateRequestId()
      const startTime = Date.now()

      // Log request start
      console.log(`[${requestId}] ${request.method} ${request.url} started`)

      // Add request ID to context
      const enhancedContext = {
        ...context,
        requestId,
        startTime,
      }

      // Execute the handler
      const response = await this.handler(request, enhancedContext)

      // Log successful completion
      const duration = Date.now() - startTime
      console.log(
        `[${requestId}] ${request.method} ${request.url} completed in ${duration}ms`
      )

      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId)

      return response
    } catch (error: unknown) {
      // Use standardized error handling
      const errorObj = error instanceof Error ? error : new Error(String(error))
      const response = handleApiError(
        errorObj,
        `${this.constructor.name}.handle`
      )

      // Ensure we return a NextResponse
      if (response instanceof NextResponse) {
        return response
      }

      // Fallback error response
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  /**
   * Generate a unique request ID for tracing
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Standard success response helper
   */
  protected success(
    data: unknown,
    status: number = 200,
    meta?: Record<string, unknown>
  ): NextResponse {
    const response = {
      success: true,
      data,
      ...(meta && { meta: meta as Record<string, unknown> }),
    }

    return NextResponse.json(response, { status })
  }

  /**
   * Standard error response helper
   */
  protected error(
    message: string,
    status: number = 400,
    details?: unknown,
    code?: string
  ): NextResponse {
    const response: Record<string, unknown> = {
      success: false,
      error: message,
    }

    if (details !== undefined) {
      response.details = details
    }

    if (code !== undefined) {
      response.code = code
    }

    return NextResponse.json(response, { status })
  }

  /**
   * Validate required environment variables
   */
  protected validateEnvVars(requiredVars: string[]): void {
    const missing: string[] = []

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName)
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`
      )
    }
  }
}

/**
 * Higher-order function to wrap API route handlers with BaseAPIRoute functionality
 */
export function withAPIHandler<T extends BaseAPIRoute>(
  HandlerClass: new () => T
): (
  request: NextRequest,
  context?: Record<string, unknown>
) => Promise<NextResponse> {
  const handlerInstance = new HandlerClass()

  return (request: NextRequest, context?: Record<string, unknown>) =>
    handlerInstance.handle(request, context)
}
