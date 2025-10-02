import type { Prisma } from '@prisma/client'
import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check role - admin, studio-admin, or photographer can view orders
  const auth = await withRoleCheck(
    ['admin', 'studio-admin', 'photographer'],
    request
  )
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    const { id } = await params

    // Build where clause based on user role
    let whereClause: Prisma.OrderWhereUniqueInput = { id }

    if (auth.user.role === 'photographer') {
      // Photographers can only see orders from their sessions
      const photographer = await prisma.photographer.findFirst({
        where: { email: auth.user.email },
        select: { id: true, studioId: true },
      })

      if (!photographer) {
        return NextResponse.json(
          { error: 'Photographer not found' },
          { status: 404 }
        )
      }

      whereClause = {
        id,
        photographerId: photographer.id,
        studioId: photographer.studioId,
      }
    } else if (auth.user.role === 'studio-admin') {
      // Studio admins can see orders from their studio
      whereClause = {
        id,
        studioId: auth.studioId,
      }
    }

    const order = await prisma.order.findUnique({
      where: whereClause,
      include: {
        session: {
          select: {
            id: true,
            name: true,
            scheduledAt: true,
          },
        },
        photographer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        studio: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            photo: {
              select: {
                id: true,
                fileName: true,
                filePath: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Get order API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
