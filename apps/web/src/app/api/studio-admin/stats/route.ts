import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

export async function GET(request: NextRequest) {
  // Check studio-admin or admin role
  const auth = await withRoleCheck(['studio-admin', 'admin'], request)
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    // For studio-admin use their client_id, for admin - from header or all
    let clientId = auth.clientId

    // If admin and x-client-id is provided, use it
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

    // Get statistics for client
    const [totalPhotographers, totalPhotoSessions, totalPhotos] =
      await Promise.all([
        prisma.photographer.count({ where: { clientId } }),
        prisma.photoSession.count({ where: { clientId } }),
        prisma.photo.count({ where: { clientId } }),
      ])

    // Orders not implemented yet
    const totalOrders = 0
    const revenue = 0

    return NextResponse.json({
      stats: {
        totalPhotographers,
        totalPhotoSessions,
        totalPhotos,
        totalOrders,
        revenue,
      },
      clientId,
    })
  } catch (error) {
    console.error('Admin stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
