import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check role - only photographers, studio-admin, and admin can delete photos
  const auth = await withRoleCheck(
    ['photographer', 'studio-admin', 'admin'],
    request
  )
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    const resolvedParams = await params
    const photoId = resolvedParams.id

    if (!photoId) {
      return NextResponse.json(
        { error: 'Photo ID is required' },
        { status: 400 }
      )
    }

    // For studio-admin/photographer use their client_id, for admin - from header or all
    let clientId = auth.clientId

    // If admin and x-client-id is provided, use it
    if (auth.user.role === 'admin') {
      const headerClientId = request.headers.get('x-client-id')
      if (headerClientId) {
        clientId = headerClientId
      }
    }

    // Verify photo exists and belongs to the client
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        ...(clientId ? { clientId } : {}),
      },
    })

    if (!photo) {
      return NextResponse.json(
        {
          error:
            'Photo not found or you do not have permission to delete this photo',
        },
        { status: 404 }
      )
    }

    // Delete the photo
    await prisma.photo.delete({
      where: {
        id: photoId,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Photo deleted successfully`,
      photoId: photoId,
    })
  } catch (error) {
    console.error('Delete photo error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
