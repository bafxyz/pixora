import type { NextRequest } from 'next/server'
import { prisma } from '@/shared/lib/prisma/client'
import { createClient } from '@/shared/lib/supabase/server'
import { ApiErrors } from '../api-error-handler'

export type UserRole = 'admin' | 'studio-admin' | 'photographer' | 'guest'

export interface AuthResult {
  user: {
    id: string
    email: string
    role: UserRole
  }
  studioId?: string
}

/**
 * Gets authenticated user with role verification
 */
export async function withRoleCheck(
  allowedRoles: UserRole[],
  _request: NextRequest
): Promise<AuthResult> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw ApiErrors.unauthorized('Please login to access this resource')
  }

  // Get user role from metadata
  const userRole = (user.user_metadata?.role || 'photographer') as UserRole

  // Check if user role is in the allowed roles list
  if (!allowedRoles.includes(userRole)) {
    throw ApiErrors.forbidden(
      `Access denied. Required roles: ${allowedRoles.join(', ')}`
    )
  }

  // For studio-admins and photographers, get their studio_id
  let studioId: string | undefined

  if (userRole === 'studio-admin') {
    // For studio-admin, look up by Studio email
    const studio = await prisma.studio.findUnique({
      where: { email: user.email || '' },
      select: { id: true },
    })

    if (studio) {
      studioId = studio.id
    } else {
      throw ApiErrors.internalError(
        'Studio admin user has no associated studio'
      )
    }
  } else if (userRole === 'photographer') {
    // For photographer, look up by Photographer email
    const photographer = await prisma.photographer.findFirst({
      where: { email: user.email || '' },
      select: { studioId: true },
    })

    if (photographer) {
      studioId = photographer.studioId
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email || '',
      role: userRole,
    },
    studioId,
  }
}

/**
 * Checks if a resource belongs to the user's studio
 */
export function canAccessStudioResource(
  userStudioId: string | undefined,
  resourceStudioId: string,
  userRole: UserRole
): boolean {
  // Admin has access to all resources
  if (userRole === 'admin') {
    return true
  }

  // For other roles, check if studio_id matches
  return userStudioId === resourceStudioId
}
