import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get client_id from headers (set by middleware)
    const clientId = request.headers.get('x-client-id')
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID not found' },
        { status: 400 }
      )
    }

    const { guestId, photoUrls } = await request.json()

    if (!guestId || !photoUrls || !Array.isArray(photoUrls)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Verify guest exists and belongs to this client
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id')
      .eq('id', guestId)
      .eq('client_id', clientId)
      .single()

    if (guestError || !guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    // Insert photos into database
    const photosToInsert = photoUrls.map((url: string) => ({
      guest_id: guestId,
      client_id: clientId,
      url,
      uploaded_at: new Date().toISOString(),
    }))

    const { data: insertedPhotos, error: insertError } = await supabase
      .from('photos')
      .insert(photosToInsert)
      .select()

    if (insertError) {
      console.error('Error saving photos:', insertError)
      return NextResponse.json(
        { error: 'Failed to save photos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      photos: insertedPhotos,
      count: insertedPhotos?.length || 0,
    })
  } catch (error) {
    console.error('Save photos error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
