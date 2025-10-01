import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // Check studio-admin or admin role
  const auth = await withRoleCheck(['studio-admin', 'admin'], request)
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
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
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      )
    }

    // Check access permissions
    if (
      auth.user.role === 'studio-admin' &&
      photographer.studioId !== auth.studioId
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Format response
    const formattedPhotographer = {
      id: photographer.id,
      name: photographer.name,
      email: photographer.email,
      phone: photographer.phone,
      branding: photographer.branding,
      createdAt: photographer.createdAt,
      photoCount: photographer._count.photos,
      sessionCount: photographer._count.photoSessions,
    }

    return NextResponse.json({ photographer: formattedPhotographer })
  } catch (error) {
    console.error('Photographer fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photographer' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  // Check studio-admin or admin role
  const auth = await withRoleCheck(['studio-admin', 'admin'], request)
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, phone, branding } = body

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
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      )
    }

    // Check access permissions
    if (
      auth.user.role === 'studio-admin' &&
      existingPhotographer.studioId !== auth.studioId
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
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
        return NextResponse.json(
          { error: 'Photographer with this email already exists' },
          { status: 400 }
        )
      }
    }

    // Update photographer
    const updateData: Record<string, string | null | object> = {}
    if (name) updateData.name = name.trim()
    if (email) updateData.email = email.trim().toLowerCase()
    if (phone !== undefined) updateData.phone = phone?.trim() || null
    if (branding) updateData.branding = branding

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
      branding: updatedPhotographer.branding,
      createdAt: updatedPhotographer.createdAt,
      photoCount: updatedPhotographer._count.photos,
      sessionCount: updatedPhotographer._count.photoSessions,
    }

    return NextResponse.json({
      photographer: formattedPhotographer,
      message: 'Photographer updated successfully',
    })
  } catch (error) {
    console.error('Photographer update error:', error)
    return NextResponse.json(
      { error: 'Failed to update photographer' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // Check studio-admin or admin role
  const auth = await withRoleCheck(['studio-admin', 'admin'], request)
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
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
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      )
    }

    // Check access permissions
    if (
      auth.user.role === 'studio-admin' &&
      existingPhotographer.studioId !== auth.studioId
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if photographer has associated data
    if (
      existingPhotographer._count.photos > 0 ||
      existingPhotographer._count.photoSessions > 0
    ) {
      return NextResponse.json(
        {
          error:
            'Cannot delete photographer with associated photos or sessions. Please transfer or delete their data first.',
        },
        { status: 400 }
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
    console.error('Photographer deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete photographer' },
      { status: 500 }
    )
  }
}
