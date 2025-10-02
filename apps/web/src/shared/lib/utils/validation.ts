import type { z } from 'zod'
import { ApiErrors } from '../api-error-handler'

/**
 * Validates request body data against a Zod schema
 * Returns validated data or throws validation error
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): T {
  const result = schema.safeParse(body)

  if (!result.success) {
    const issues = result.error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }))

    throw ApiErrors.validation('Validation failed', { issues })
  }

  return result.data
}

/**
 * Validates query parameters against a Zod schema
 * Returns validated data or throws validation error
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  const params = Object.fromEntries(searchParams.entries())
  const result = schema.safeParse(params)

  if (!result.success) {
    const issues = result.error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }))

    throw ApiErrors.validation('Invalid query parameters', { issues })
  }

  return result.data
}

/**
 * Optional validation - returns null if validation fails instead of throwing
 */
export function validateRequestBodyOptional<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): T | null {
  try {
    return validateRequestBody(body, schema)
  } catch {
    return null
  }
}

export function validateQueryParamsOptional<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T | null {
  try {
    return validateQueryParams(searchParams, schema)
  } catch {
    return null
  }
}
