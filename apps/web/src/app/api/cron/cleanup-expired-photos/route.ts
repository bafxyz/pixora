import { createClient as createServerClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma/client'

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron attempt detected')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Optional: Add IP whitelisting for additional security
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const allowedIPs = process.env.ALLOWED_CRON_IPS?.split(',') || []

    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      console.warn(`Unauthorized cron attempt from IP: ${clientIP}`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client with service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      )
    }

    const supabase = createServerClient(supabaseUrl, serviceRoleKey)

    // Find all expired photos
    const expiredPhotos = await prisma.photo.findMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
      select: {
        id: true,
        filePath: true,
        fileName: true,
      },
    })

    if (expiredPhotos.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired photos found',
        deletedCount: 0,
      })
    }

    // Delete files from Supabase storage
    const deletePromises = expiredPhotos.map(async (photo) => {
      try {
        // Extract filename from the public URL
        // URLs are like: https://...supabase.co/storage/v1/object/public/photos/guestId/timestamp-random.ext
        const url = new URL(photo.filePath)
        const pathParts = url.pathname.split('/')
        // Find the 'photos' bucket part and get everything after it
        const photosIndex = pathParts.indexOf('photos')
        if (photosIndex === -1) {
          throw new Error('Invalid photo URL format')
        }
        const fileName = pathParts.slice(photosIndex + 1).join('/')

        const { error } = await supabase.storage
          .from('photos')
          .remove([fileName])

        if (error) {
          throw error
        }

        return { success: true, photoId: photo.id }
      } catch (error) {
        console.error(`Failed to delete file for photo ${photo.id}:`, error)
        return { success: false, photoId: photo.id, error: error }
      }
    })

    // Wait for all deletions to complete
    const deleteResults = await Promise.allSettled(deletePromises)

    // Process results with proper type handling
    const successfulDeletes: string[] = []
    let failedDeletes = 0

    // Process each result individually to satisfy TypeScript
    for (let index = 0; index < deleteResults.length; index++) {
      const result = deleteResults[index]
      if (result && result.status === 'fulfilled') {
        if (result.value.success) {
          const photo = expiredPhotos[index]
          if (photo) {
            successfulDeletes.push(photo.id)
          }
        } else {
          failedDeletes++
        }
      } else {
        // Rejected promise counts as a failed deletion
        failedDeletes++
      }
    }

    if (successfulDeletes.length > 0) {
      await prisma.photo.deleteMany({
        where: {
          id: {
            in: successfulDeletes,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      deletedCount: successfulDeletes.length,
      failedCount: failedDeletes,
      totalExpired: expiredPhotos.length,
    })
  } catch (error) {
    console.error('Error in cleanup cron job:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// This endpoint should only be accessible via POST
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
