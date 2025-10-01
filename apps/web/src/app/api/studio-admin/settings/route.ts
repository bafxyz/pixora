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

    // Get studio with settings
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        branding: true,
        settings: true,
      },
    })

    if (!studio) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 })
    }

    // Extract branding and settings data
    const branding = (studio.branding as Record<string, unknown>) || {}
    const settings = (studio.settings as Record<string, unknown>) || {}

    return NextResponse.json({
      studioName: studio.name,
      contactEmail: studio.email,
      contactPhone: studio.phone || '',
      contactAddress: studio.address || '',
      brandColor: branding.brandColor || '#000000',
      logoUrl: branding.logoUrl || '',
      welcomeMessage: branding.welcomeMessage || '',
      pricing: settings.pricing || {
        digital: 25,
        print: 50,
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

    // Prepare branding object
    const branding: Record<string, unknown> = {
      ...(settings.brandColor && { brandColor: settings.brandColor }),
      ...(settings.logoUrl && { logoUrl: settings.logoUrl }),
      ...(settings.welcomeMessage && {
        welcomeMessage: settings.welcomeMessage,
      }),
    }

    // Prepare settings object
    const updateData: Record<string, unknown> = {
      ...(settings.studioName && { name: settings.studioName }),
      ...(settings.contactEmail && { email: settings.contactEmail }),
      ...(settings.contactPhone && { phone: settings.contactPhone }),
      ...(settings.contactAddress && { address: settings.contactAddress }),
    }

    // Update branding in settings object
    if (Object.keys(branding).length > 0) {
      updateData.branding = {
        ...(((
          await prisma.studio.findUnique({
            where: { id: studioId },
            select: { branding: true },
          })
        )?.branding as Record<string, unknown>) || {}),
        ...branding,
      }
    }

    // Update settings in settings object
    if (settings.pricing) {
      const currentSettings =
        ((
          await prisma.studio.findUnique({
            where: { id: studioId },
            select: { settings: true },
          })
        )?.settings as Record<string, unknown>) || {}

      updateData.settings = {
        ...currentSettings,
        pricing: settings.pricing,
      }
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
        branding: true,
        settings: true,
      },
    })

    return NextResponse.json({
      success: true,
      settings: {
        studioName: updatedStudio.name,
        contactEmail: updatedStudio.email,
        contactPhone: updatedStudio.phone || '',
        contactAddress: updatedStudio.address || '',
        brandColor:
          (updatedStudio.branding as Record<string, unknown>)?.brandColor ||
          '#000000',
        logoUrl:
          (updatedStudio.branding as Record<string, unknown>)?.logoUrl || '',
        welcomeMessage:
          (updatedStudio.branding as Record<string, unknown>)?.welcomeMessage ||
          '',
        pricing: (updatedStudio.settings as Record<string, unknown>)
          ?.pricing || {
          digital: 25,
          print: 50,
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
