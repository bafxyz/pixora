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
    // For studio-admin use their studio_id, for admin - from header or all
    let studioId = auth.studioId

    // If admin and x-studio-id is provided, use it
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

    // Get statistics for studio
    const [totalPhotographers, totalPhotoSessions, totalPhotos] =
      await Promise.all([
        prisma.photographer.count({ where: { studioId } }),
        prisma.photoSession.count({ where: { studioId } }),
        prisma.photo.count({ where: { studioId } }),
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
      studioId,
    })
  } catch (error) {
    console.error('Admin stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
