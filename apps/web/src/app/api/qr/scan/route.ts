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

    // Use client_id from auth
    const clientId = auth.clientId

    if (!clientId && auth.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Find photographer by email from auth

    const photographer = await prisma.photographer.findFirst({
      where: {
        email: auth.user.email,
        ...(clientId ? { clientId } : {}),
      },
      select: {
        id: true,
        name: true,
        clientId: true,
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

    const { id: guestId, name: guestName } = validationResult.data

    // Check if guest already exists
    const existingGuest = await prisma.guest.findFirst({
      where: {
        id: guestId as string,
        ...(clientId ? { clientId } : {}),
      },
      select: {
        id: true,
        name: true,
      },
    })

    if (existingGuest) {
      // Guest already exists
      return NextResponse.json({
        success: true,
        guest: existingGuest,
        message: 'Guest already exists',
      })
    }

    // Create new guest
    const newGuest = await prisma.guest.create({
      data: {
        id: guestId as string,
        name: guestName as string,
        clientId: clientId || photographer.clientId,
        email: null, // Can be added later
        photographerId: photographer.id,
      },
    })

    return NextResponse.json({
      success: true,
      guest: newGuest,
      message: 'Guest created successfully',
    })
  } catch (error) {
    console.error('QR scan API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
