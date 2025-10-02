import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

interface StudioSettings {
  brandColor?: string
  logoUrl?: string
  welcomeMessage?: string
  studioName?: string
  contactEmail?: string
  contactPhone?: string
  contactAddress?: string
  pricing?: {
    digital: number
    print: number
    magnet: number
    currency: string
  }
}

export async function GET(request: NextRequest) {
  // Check studio-admin or admin role
  const auth = await withRoleCheck(['studio-admin', 'admin'], request)
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    // For studio-admin, get their studio's settings
    // For admin, get studio from headers if specified
    let studioId = auth.studioId

    if (auth.user.role === 'admin') {
      const headerStudioId = request.headers.get('x-studio-id')
      if (headerStudioId) {
        studioId = headerStudioId
      }
    }

    if (!studioId) {
      return NextResponse.json(
        { error: 'Studio ID is required' },
        { status: 400 }
      )
    }

    // Get studio with settings and pricing
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        settings: true,
        pricing: {
          where: { isActive: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!studio) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 })
    }

    const activePricing = studio.pricing[0]

    return NextResponse.json({
      studioName: studio.name,
      contactEmail: studio.email,
      contactPhone: studio.phone || '',
      contactAddress: studio.address || '',
      pricing: activePricing
        ? {
            digital: Number(activePricing.priceDigital),
            print: Number(activePricing.pricePrint),
            magnet: Number(activePricing.priceMagnet),
            currency: activePricing.currency,
          }
        : {
            digital: 500,
            print: 750,
            magnet: 750,
            currency: 'RUB',
          },
    })
  } catch (error) {
    console.error('Studio settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  // Check studio-admin or admin role
  const auth = await withRoleCheck(['studio-admin', 'admin'], request)
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    const settings: StudioSettings = await request.json()

    // For studio-admin, use their studio_id
    // For admin, get studio from headers if specified
    let studioId = auth.studioId

    if (auth.user.role === 'admin') {
      const headerStudioId = request.headers.get('x-studio-id')
      if (headerStudioId) {
        studioId = headerStudioId
      }
    }

    if (!studioId) {
      return NextResponse.json(
        { error: 'Studio ID is required' },
        { status: 400 }
      )
    }

    // Prepare settings object
    const updateData: Record<string, unknown> = {
      ...(settings.studioName && { name: settings.studioName }),
      ...(settings.contactEmail && { email: settings.contactEmail }),
      ...(settings.contactPhone && { phone: settings.contactPhone }),
      ...(settings.contactAddress && { address: settings.contactAddress }),
    }

    // Update studio in database
    const updatedStudio = await prisma.studio.update({
      where: { id: studioId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
      },
    })

    // Update or create pricing
    if (settings.pricing) {
      // First, deactivate all existing pricing entries
      await prisma.pricing.updateMany({
        where: { studioId, isActive: true },
        data: { isActive: false },
      })

      // Create new pricing entry
      await prisma.pricing.create({
        data: {
          studioId,
          priceDigital: settings.pricing.digital,
          pricePrint: settings.pricing.print,
          priceMagnet: settings.pricing.magnet,
          currency: settings.pricing.currency,
          isActive: true,
        },
      })
    }

    // Get latest pricing
    const latestPricing = await prisma.pricing.findFirst({
      where: { studioId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      settings: {
        studioName: updatedStudio.name,
        contactEmail: updatedStudio.email,
        contactPhone: updatedStudio.phone || '',
        contactAddress: updatedStudio.address || '',
        pricing: latestPricing
          ? {
              digital: Number(latestPricing.priceDigital),
              print: Number(latestPricing.pricePrint),
              magnet: Number(latestPricing.priceMagnet),
              currency: latestPricing.currency,
            }
          : {
              digital: 500,
              print: 750,
              magnet: 750,
              currency: 'RUB',
            },
      },
    })
  } catch (error) {
    console.error('Update studio settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
