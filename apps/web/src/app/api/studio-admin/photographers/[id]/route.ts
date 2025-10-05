import { type NextRequest, NextResponse } from 'next/server'
import { ApiErrors, handleApiError } from '@/shared/lib/api-error-handler'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check studio-admin or admin role
    const auth = await withRoleCheck(['studio-admin', 'admin'], request)

    const { id } = await params

    // Get photographer details
    const photographer = await prisma.photographer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            photos: true,
            photoSessions: true,
          },
        },
      },
    })

    if (!photographer) {
      throw ApiErrors.notFound('Photographer not found')
    }

    // Check access permissions
    if (
      auth.user.role === 'studio-admin' &&
      photographer.studioId !== auth.studioId
    ) {
      throw ApiErrors.forbidden('Access denied')
    }

    // Format response
    const formattedPhotographer = {
      id: photographer.id,
      name: photographer.name,
      email: photographer.email,
      phone: photographer.phone,
      createdAt: photographer.createdAt,
      photoCount: photographer._count.photos,
      sessionCount: photographer._count.photoSessions,
    }

    return NextResponse.json({ photographer: formattedPhotographer })
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      'GET /api/studio-admin/photographers/[id]',
      request
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Check studio-admin or admin role
    const auth = await withRoleCheck(['studio-admin', 'admin'], request)
    const { id } = await params
    const body = await request.json()
    const { name, email, phone } = body

    // Check if photographer exists and user has permission
    const existingPhotographer = await prisma.photographer.findUnique({
      where: { id },
      select: {
        id: true,
        studioId: true,
        email: true,
      },
    })

    if (!existingPhotographer) {
      throw ApiErrors.notFound('Photographer not found')
    }

    // Check access permissions
    if (
      auth.user.role === 'studio-admin' &&
      existingPhotographer.studioId !== auth.studioId
    ) {
      throw ApiErrors.forbidden('Access denied')
    }

    // If email is being changed, check for duplicates
    if (email && email !== existingPhotographer.email) {
      const emailExists = await prisma.photographer.findFirst({
        where: {
          email: email.trim().toLowerCase(),
          studioId: existingPhotographer.studioId,
          id: { not: id },
        },
      })

      if (emailExists) {
        throw ApiErrors.badRequest(
          'Photographer with this email already exists'
        )
      }
    }

    // Update photographer
    const updateData: Record<string, string | null | object> = {}
    if (name) updateData.name = name.trim()
    if (email) updateData.email = email.trim().toLowerCase()
    if (phone !== undefined) updateData.phone = phone?.trim() || null

    const updatedPhotographer = await prisma.photographer.update({
      where: { id },
      data: updateData as never,
      include: {
        _count: {
          select: {
            photos: true,
            photoSessions: true,
          },
        },
      },
    })

    // Format response
    const formattedPhotographer = {
      id: updatedPhotographer.id,
      name: updatedPhotographer.name,
      email: updatedPhotographer.email,
      phone: updatedPhotographer.phone,
      createdAt: updatedPhotographer.createdAt,
      photoCount: updatedPhotographer._count.photos,
      sessionCount: updatedPhotographer._count.photoSessions,
    }

    return NextResponse.json({
      photographer: formattedPhotographer,
      message: 'Photographer updated successfully',
    })
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      'PATCH /api/studio-admin/photographers/[id]',
      request
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check studio-admin or admin role
    const auth = await withRoleCheck(['studio-admin', 'admin'], request)
    const { id } = await params

    // Check if photographer exists and user has permission
    const existingPhotographer = await prisma.photographer.findUnique({
      where: { id },
      select: {
        id: true,
        studioId: true,
        name: true,
        _count: {
          select: {
            photos: true,
            photoSessions: true,
          },
        },
      },
    })

    if (!existingPhotographer) {
      throw ApiErrors.notFound('Photographer not found')
    }

    // Check access permissions
    if (
      auth.user.role === 'studio-admin' &&
      existingPhotographer.studioId !== auth.studioId
    ) {
      throw ApiErrors.forbidden('Access denied')
    }

    // Check if photographer has associated data
    if (
      existingPhotographer._count.photos > 0 ||
      existingPhotographer._count.photoSessions > 0
    ) {
      throw ApiErrors.badRequest(
        'Cannot delete photographer with associated photos or sessions. Please transfer or delete their data first.'
      )
    }

    // Delete photographer
    await prisma.photographer.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Photographer deleted successfully',
    })
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      'DELETE /api/studio-admin/photographers/[id]',
      request
    )
  }
}
