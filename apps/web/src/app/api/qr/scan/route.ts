import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma/client'
import { qrDataSchema } from '@/shared/lib/validations/auth.schemas'

export async function POST(request: NextRequest) {
  try {
    const { qrData } = await request.json()

    if (!qrData) {
      return NextResponse.json(
        { error: 'QR data is required' },
        { status: 400 }
      )
    }

    // Get client_id from headers
    const clientId = request.headers.get('x-client-id')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 401 }
      )
    }

    // Get current user via Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // No-op for API routes
        },
      },
    })

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find photographer by user email
    if (!session.user.email) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      )
    }

    const photographer = await prisma.photographer.findUnique({
      where: {
        email: session.user.email,
        clientId,
      },
      select: {
        id: true,
        name: true,
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
        clientId,
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
        clientId,
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
