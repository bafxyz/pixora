import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/shared/lib/prisma/client'
import { createClient } from '@/shared/lib/supabase/client'

const pricingSchema = z.object({
  pricePerPhoto: z.number().min(0),
  bulkDiscountThreshold: z.number().min(0),
  bulkDiscountPercent: z.number().min(0).max(100),
  currency: z.string().default('RUB'),
})

// GET /api/studio-admin/pricing - Get current pricing
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get studio info
    const studio = await prisma.studio.findFirst({
      where: {
        OR: [
          { email: user.email },
          { photographers: { some: { email: user.email } } },
        ],
      },
    })

    if (!studio) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 })
    }

    const pricing = await prisma.pricing.findFirst({
      where: {
        studioId: studio.id,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!pricing) {
      // Create default pricing if none exists
      const defaultPricing = await prisma.pricing.create({
        data: {
          studioId: studio.id,
          pricePerPhoto: 5.0,
          bulkDiscountThreshold: 20,
          bulkDiscountPercent: 15,
          currency: 'RUB',
        },
      })

      return NextResponse.json({ pricing: defaultPricing })
    }

    return NextResponse.json({ pricing })
  } catch (error) {
    console.error('Error fetching pricing:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pricing' },
      { status: 500 }
    )
  }
}

// POST /api/studio-admin/pricing - Update pricing
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get studio info
    const studio = await prisma.studio.findFirst({
      where: {
        OR: [
          { email: user.email },
          { photographers: { some: { email: user.email } } },
        ],
      },
    })

    if (!studio) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = pricingSchema.parse(body)

    // Deactivate old pricing
    await prisma.pricing.updateMany({
      where: {
        studioId: studio.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })

    // Create new pricing
    const newPricing = await prisma.pricing.create({
      data: {
        studioId: studio.id,
        ...validatedData,
      },
    })

    return NextResponse.json({ pricing: newPricing }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating pricing:', error)
    return NextResponse.json(
      { error: 'Failed to update pricing' },
      { status: 500 }
    )
  }
}
