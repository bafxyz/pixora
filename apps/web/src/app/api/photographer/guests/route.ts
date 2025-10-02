import { createClient } from '@/shared/lib/supabase/client'
import { prisma } from '@/shared/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createGuestSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  phone: z.string().optional(),
  sessionId: z.string().uuid().optional(),
})

// GET /api/photographer/guests - Get guests for current photographer
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get photographer info
    const photographer = await prisma.photographer.findUnique({
      where: { email: user.email },
      include: {
        studio: true,
      },
    })

    if (!photographer) {
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    const guests = await prisma.guest.findMany({
      where: {
        studioId: photographer.studioId,
        photographerId: photographer.id,
        ...(sessionId && { sessionId }),
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ guests })
  } catch (error) {
    console.error('Error fetching guests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch guests' },
      { status: 500 }
    )
  }
}

// POST /api/photographer/guests - Create a new guest
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get photographer info
    const photographer = await prisma.photographer.findUnique({
      where: { email: user.email },
      include: {
        studio: true,
      },
    })

    if (!photographer) {
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = createGuestSchema.parse(body)

    // Check if guest already exists
    const existingGuest = await prisma.guest.findFirst({
      where: {
        email: validatedData.email,
        studioId: photographer.studioId,
      },
    })

    if (existingGuest) {
      return NextResponse.json(
        { error: 'Guest with this email already exists' },
        { status: 409 }
      )
    }

    // Generate unique QR code
    const qrCode = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const guest = await prisma.guest.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        phone: validatedData.phone,
        studioId: photographer.studioId,
        photographerId: photographer.id,
        sessionId: validatedData.sessionId,
        qrCode,
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

    return NextResponse.json({ guest }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating guest:', error)
    return NextResponse.json(
      { error: 'Failed to create guest' },
      { status: 500 }
    )
  }
}
