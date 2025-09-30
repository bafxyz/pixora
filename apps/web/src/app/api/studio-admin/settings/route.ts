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
    // For studio-admin, get their client's settings
    // For admin, get client from headers if specified
    let clientId = auth.clientId

    if (auth.user.role === 'admin') {
      const headerClientId = request.headers.get('x-client-id')
      if (headerClientId) {
        clientId = headerClientId
      }
    }

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Get client with settings
    const client = await prisma.client.findUnique({
      where: { id: clientId },
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

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Extract branding and settings data
    const branding = (client.branding as Record<string, unknown>) || {}
    const settings = (client.settings as Record<string, unknown>) || {}

    return NextResponse.json({
      studioName: client.name,
      contactEmail: client.email,
      contactPhone: client.phone || '',
      contactAddress: client.address || '',
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

    // For studio-admin, use their client_id
    // For admin, get client from headers if specified
    let clientId = auth.clientId

    if (auth.user.role === 'admin') {
      const headerClientId = request.headers.get('x-client-id')
      if (headerClientId) {
        clientId = headerClientId
      }
    }

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
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
          await prisma.client.findUnique({
            where: { id: clientId },
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
          await prisma.client.findUnique({
            where: { id: clientId },
            select: { settings: true },
          })
        )?.settings as Record<string, unknown>) || {}

      updateData.settings = {
        ...currentSettings,
        pricing: settings.pricing,
      }
    }

    // Update client in database
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
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
        studioName: updatedClient.name,
        contactEmail: updatedClient.email,
        contactPhone: updatedClient.phone || '',
        contactAddress: updatedClient.address || '',
        brandColor:
          (updatedClient.branding as Record<string, unknown>)?.brandColor ||
          '#000000',
        logoUrl:
          (updatedClient.branding as Record<string, unknown>)?.logoUrl || '',
        welcomeMessage:
          (updatedClient.branding as Record<string, unknown>)?.welcomeMessage ||
          '',
        pricing: (updatedClient.settings as Record<string, unknown>)
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
