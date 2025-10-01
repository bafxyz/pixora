import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  // Check admin role
  const auth = await withRoleCheck(['admin'], request)
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    const { id } = await context.params
    const { name, email } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if studio exists
    const existingStudio = await prisma.studio.findUnique({
      where: { id },
    })

    if (!existingStudio) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 })
    }

    // If email is being changed, check if it's already in use
    if (email && email.trim() !== existingStudio.email) {
      const emailInUse = await prisma.studio.findUnique({
        where: { email: email.trim() },
      })

      if (emailInUse) {
        return NextResponse.json(
          { error: 'Email already in use by another studio' },
          { status: 409 }
        )
      }
    }

    // Update studio
    const updatedStudio = await prisma.studio.update({
      where: { id },
      data: {
        name: name.trim(),
        ...(email?.trim() && { email: email.trim() }),
      },
      include: {
        _count: {
          select: {
            photographers: true,
            photos: true,
            photoSessions: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      studio: {
        id: updatedStudio.id,
        name: updatedStudio.name,
        email: updatedStudio.email,
        createdAt: updatedStudio.createdAt,
        photographersCount: updatedStudio._count.photographers,
        photosCount: updatedStudio._count.photos,
        sessionsCount: updatedStudio._count.photoSessions,
      },
    })
  } catch (error) {
    console.error('Update studio API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  // Check admin role
  const auth = await withRoleCheck(['admin'], request)
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    const { id } = await context.params

    // Check if studio exists
    const existingStudio = await prisma.studio.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            photographers: true,
            photos: true,
            photoSessions: true,
          },
        },
      },
    })

    if (!existingStudio) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 })
    }

    // Check if studio has related data
    const hasRelatedData =
      existingStudio._count.photographers > 0 ||
      existingStudio._count.photos > 0 ||
      existingStudio._count.photoSessions > 0

    if (hasRelatedData) {
      return NextResponse.json(
        {
          error:
            'Cannot delete studio with existing photographers, photos, or sessions',
        },
        { status: 409 }
      )
    }

    // Delete studio
    await prisma.studio.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Studio deleted successfully',
    })
  } catch (error) {
    console.error('Delete studio API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
