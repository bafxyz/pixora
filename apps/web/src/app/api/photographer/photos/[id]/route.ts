import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'
import { createClient } from '@/shared/lib/supabase/client'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check photographer, studio-admin or admin role
  const auth = await withRoleCheck(
    ['photographer', 'studio-admin', 'admin'],
    request
  )
  if (auth instanceof NextResponse) {
    return auth // Return 403/401 error
  }

  try {
    const { id: photoId } = await params

    if (!photoId) {
      return NextResponse.json(
        { error: 'Photo ID is required' },
        { status: 400 }
      )
    }

    // Find the photo and verify access
    const whereClause: {
      id: string
      photographerId?: string
      clientId?: string
    } = { id: photoId }

    if (auth.user.role === 'photographer') {
      const photographer = await prisma.photographer.findFirst({
        where: { email: auth.user.email },
        select: { id: true },
      })

      if (!photographer) {
        return NextResponse.json(
          { error: 'Photographer record not found' },
          { status: 400 }
        )
      }

      whereClause.photographerId = photographer.id
    } else if (auth.clientId) {
      whereClause.clientId = auth.clientId
    }

    const photo = await prisma.photo.findFirst({
      where: whereClause,
      select: {
        id: true,
        filePath: true,
        fileName: true,
      },
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found or access denied' },
        { status: 404 }
      )
    }

    // Delete from Supabase Storage
    const supabase = createClient()
    const filePath = photo.filePath.split('/').pop() // Extract filename from URL

    if (filePath) {
      try {
        // Try to delete from storage (non-critical if it fails)
        await supabase.storage.from('photos').remove([filePath])
      } catch (storageError) {
        console.warn('Failed to delete file from storage:', storageError)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    await prisma.photo.delete({
      where: { id: photoId },
    })

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
    })
  } catch (error) {
    console.error('Delete photo API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
