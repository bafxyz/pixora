import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma/client'
import { createClient } from '@/shared/lib/supabase/server'

export type UserRole = 'admin' | 'studio-admin' | 'photographer' | 'guest'

interface AuthResult {
  user: {
    id: string
    email: string
    role: UserRole
  }
  clientId?: string
}

/**
 * Checks user role and returns user data or error
 * @param allowedRoles - Array of allowed roles
 * @param request - NextRequest object
 * @returns AuthResult with user data or NextResponse with error
 */
export async function requireRole(
  allowedRoles: UserRole[],
  _request: NextRequest
): Promise<AuthResult | NextResponse> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Auth error in role-guard:', error?.message)
      return NextResponse.json(
        { error: 'Unauthorized: Please login to access this resource' },
        { status: 401 }
      )
    }

    // Get user role from metadata
    const userRole = (user.user_metadata?.role || 'guest') as UserRole

    // Check if user role is in the allowed roles list
    if (!allowedRoles.includes(userRole)) {
      console.warn(
        `Access denied for user ${user.id} with role ${userRole}. Required roles: ${allowedRoles.join(', ')}`
      )
      return NextResponse.json(
        {
          error:
            'Forbidden: You do not have permission to access this resource',
          requiredRoles: allowedRoles,
          userRole,
        },
        { status: 403 }
      )
    }

    // For studio-admins and photographers, get their client_id
    let clientId: string | undefined

    if (userRole === 'studio-admin' || userRole === 'photographer') {
      try {
        const photographer = await prisma.photographer.findFirst({
          where: { email: user.email || '' },
          select: { clientId: true },
        })

        if (photographer) {
          clientId = photographer.clientId
        } else if (userRole === 'studio-admin') {
          // Studio admin must have a client_id
          console.error(
            `Studio admin user ${user.email} has no associated client`
          )
          return NextResponse.json(
            {
              error:
                'Configuration error: Studio admin user has no associated client',
            },
            { status: 500 }
          )
        }
      } catch (dbError) {
        console.error('Database error in role-guard:', dbError)
        // For studio-admin and photographer, this is an error
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email || '',
        role: userRole,
      },
      clientId,
    }
  } catch (error) {
    console.error('Unexpected error in role-guard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Checks if a resource belongs to the user's client
 * @param userClientId - User's client ID
 * @param resourceClientId - Resource's client ID
 * @param userRole - User role
 * @returns true if access is allowed
 */
export function canAccessClientResource(
  userClientId: string | undefined,
  resourceClientId: string,
  userRole: UserRole
): boolean {
  // Admin has access to all resources
  if (userRole === 'admin') {
    return true
  }

  // For other roles, check if client_id matches
  return userClientId === resourceClientId
}

/**
 * Middleware for role checking in API routes
 * Usage:
 * const auth = await withRoleCheck(['studio-admin', 'admin'], request)
 * if (auth instanceof NextResponse) return auth
 */
export async function withRoleCheck(
  allowedRoles: UserRole[],
  request: NextRequest
): Promise<AuthResult | NextResponse> {
  const authResult = await requireRole(allowedRoles, request)

  // Log access attempts
  if (authResult instanceof NextResponse) {
    const path = request.nextUrl.pathname
    const method = request.method
    console.log(`[SECURITY] Access denied: ${method} ${path}`)
  }

  return authResult
}
