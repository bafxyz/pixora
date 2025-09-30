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
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
    })

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // If email is being changed, check if it's already in use
    if (email && email.trim() !== existingClient.email) {
      const emailInUse = await prisma.client.findUnique({
        where: { email: email.trim() },
      })

      if (emailInUse) {
        return NextResponse.json(
          { error: 'Email already in use by another client' },
          { status: 409 }
        )
      }
    }

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name: name.trim(),
        ...(email && email.trim() && { email: email.trim() }),
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
      client: {
        id: updatedClient.id,
        name: updatedClient.name,
        email: updatedClient.email,
        createdAt: updatedClient.createdAt,
        photographersCount: updatedClient._count.photographers,
        photosCount: updatedClient._count.photos,
        sessionsCount: updatedClient._count.photoSessions,
      },
    })
  } catch (error) {
    console.error('Update client API error:', error)
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

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
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

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check if client has related data
    const hasRelatedData =
      existingClient._count.photographers > 0 ||
      existingClient._count.photos > 0 ||
      existingClient._count.photoSessions > 0

    if (hasRelatedData) {
      return NextResponse.json(
        {
          error:
            'Cannot delete client with existing photographers, photos, or sessions',
        },
        { status: 409 }
      )
    }

    // Delete client
    await prisma.client.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
    })
  } catch (error) {
    console.error('Delete client API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}