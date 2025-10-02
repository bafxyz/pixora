import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

export async function GET(request: NextRequest) {
  const auth = await withRoleCheck(['photographer'], request)
  if (auth instanceof NextResponse) {
    return auth
  }

  try {
    const photographer = await prisma.photographer.findUnique({
      where: { id: auth.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    })

    if (!photographer) {
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      )
    }

    const formattedPhotographer = {
      name: photographer.name,
      email: photographer.email,
      phone: photographer.phone || '',
    }

    return NextResponse.json({ photographer: formattedPhotographer })
  } catch (error) {
    console.error('Photographer settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photographer settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await withRoleCheck(['photographer'], request)
  if (auth instanceof NextResponse) {
    return auth
  }

  try {
    const body = await request.json()
    const { name, email, phone } = body

    // Check if photographer exists
    const existingPhotographer = await prisma.photographer.findUnique({
      where: { id: auth.user.id },
      select: {
        id: true,
        email: true,
        studioId: true,
      },
    })

    if (!existingPhotographer) {
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      )
    }

    // If email is being changed, check for duplicates
    if (email && email !== existingPhotographer.email) {
      const emailExists = await prisma.photographer.findFirst({
        where: {
          email: email.trim().toLowerCase(),
          studioId: existingPhotographer.studioId,
          id: { not: auth.user.id },
        },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Photographer with this email already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: Record<string, string | null | object> = {}
    if (name) updateData.name = name.trim()
    if (email) updateData.email = email.trim().toLowerCase()
    if (phone !== undefined) updateData.phone = phone?.trim() || null

    const updatedPhotographer = await prisma.photographer.update({
      where: { id: auth.user.id },
      data: updateData as never,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    })

    const formattedPhotographer = {
      name: updatedPhotographer.name,
      email: updatedPhotographer.email,
      phone: updatedPhotographer.phone || '',
    }

    return NextResponse.json({
      photographer: formattedPhotographer,
      message: 'Settings updated successfully',
    })
  } catch (error) {
    console.error('Photographer settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update photographer settings' },
      { status: 500 }
    )
  }
}
