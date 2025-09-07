import { NextResponse } from 'next/server'
import { z } from 'zod'

export interface ValidationSuccess<T> {
  success: true
  data: T
}

export interface ValidationError {
  success: false
  error: string
  response: NextResponse
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationError

/**
 * Validates request body data against a Zod schema
 * Returns a structured result with either validated data or an error response
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(body)
    return {
      success: true,
      data: validatedData,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      const errorMessage = firstError?.message || 'Validation failed'

      return {
        success: false,
        error: errorMessage,
        response: NextResponse.json(
          {
            error: errorMessage,
            field: firstError?.path.join('.'),
            details: error.issues.map((err: z.ZodIssue) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      }
    }

    return {
      success: false,
      error: 'Validation failed',
      response: NextResponse.json(
        { error: 'Validation failed' },
        { status: 400 }
      ),
    }
  }
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  try {
    const params = Object.fromEntries(searchParams.entries())
    const validatedData = schema.parse(params)
    return {
      success: true,
      data: validatedData,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      const errorMessage = firstError?.message || 'Invalid query parameters'

      return {
        success: false,
        error: errorMessage,
        response: NextResponse.json(
          {
            error: errorMessage,
            field: firstError?.path.join('.'),
            details: error.issues.map((err: z.ZodIssue) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      }
    }

    return {
      success: false,
      error: 'Invalid query parameters',
      response: NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      ),
    }
  }
}
