import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'
import { qrDataSchema } from '@/shared/lib/validations/auth.schemas'

export async function POST(request: NextRequest) {
  // Check role - only photographers and admins can scan QR codes
  const auth = await withRoleCheck(
    ['photographer', 'studio-admin', 'admin'],
    request
  )
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    const { qrData } = await request.json()

    if (!qrData) {
      return NextResponse.json(
        { error: 'QR data is required' },
        { status: 400 }
      )
    }

    // Use studio_id from auth
    const studioId = auth.studioId

    if (!studioId && auth.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Studio ID is required' },
        { status: 400 }
      )
    }

    // Find photographer by email from auth

    const photographer = await prisma.photographer.findFirst({
      where: {
        email: auth.user.email,
        ...(studioId ? { studioId } : {}),
      },
      select: {
        id: true,
        name: true,
        studioId: true,
      },
    })

    if (!photographer) {
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      )
    }

    // Validate QR data
    let parsedData: unknown
    try {
      parsedData = JSON.parse(qrData)
    } catch (_parseError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON format in QR data',
          details: 'QR code must contain valid JSON data',
        },
        { status: 400 }
      )
    }

    const validationResult = qrDataSchema.safeParse(parsedData)

    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ')

      return NextResponse.json(
        {
          error: 'Invalid QR data structure',
          details: errorMessages,
          validationErrors: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { id: qrCodeId, name: guestName, type } = validationResult.data

    // Handle different QR code types
    if (type === 'session') {
      // This is a session QR code, not a guest
      const session = await prisma.photoSession.findFirst({
        where: {
          id: qrCodeId,
          studioId: photographer.studioId,
        },
        select: {
          id: true,
          name: true,
          photographer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        type: 'session',
        session,
        message: 'Session scanned successfully',
      })
    }

    // Handle guest QR code
    if (type === 'guest') {
      // Check if guest already exists
      const existingGuest = await prisma.guest.findFirst({
        where: {
          qrCode: qrCodeId,
          studioId: photographer.studioId,
        },
        include: {
          session: {
            select: {
              id: true,
              name: true,
            },
          },
          orders: {
            select: {
              id: true,
              status: true,
              totalAmount: true,
              createdAt: true,
            },
            take: 5,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      })

      if (existingGuest) {
        // Update last access time
        await prisma.guest.update({
          where: { id: existingGuest.id },
          data: { lastAccessAt: new Date() },
        })

        return NextResponse.json({
          success: true,
          type: 'guest',
          guest: existingGuest,
          message: 'Guest scanned successfully',
        })
      }

      // Create new guest
      const newGuest = await prisma.guest.create({
        data: {
          email: `guest_${qrCodeId}@placeholder.com`, // Placeholder email
          name: guestName,
          studioId: photographer.studioId,
          photographerId: photographer.id,
          qrCode: qrCodeId,
        },
        include: {
          session: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        type: 'guest',
        guest: newGuest,
        message: 'Guest created successfully',
      })
    }

    return NextResponse.json(
      { error: 'Unsupported QR code type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('QR scan API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
