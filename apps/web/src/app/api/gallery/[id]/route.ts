import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/shared/lib/supabase/database.types'
import { createClient } from '@/shared/lib/supabase/server'
import { validateRequestBody } from '@/shared/lib/utils/validation'
import { updateGuestSchema } from '@/shared/lib/validations/auth.schemas'

type Photo = Database['public']['Tables']['photos']['Row']
type Guest = Database['public']['Tables']['guests']['Row']

interface GalleryResponse {
  guest: Guest
  photos: Photo[]
  photographer: {
    id: string
    name: string | null
    branding?: Record<string, unknown>
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: guestId } = await params

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get guest information
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single()

    if (guestError || !guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    // Get photos for this guest
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('guest_id', guestId)
      .eq('is_selected', true)
      .order('created_at', { ascending: false })

    if (photosError) {
      console.error('Error fetching photos:', photosError)
      return NextResponse.json(
        { error: 'Error fetching photos' },
        { status: 500 }
      )
    }

    // Get photographer information
    const { data: photographer, error: photographerError } = await supabase
      .from('photographers')
      .select('id, name, branding')
      .eq('id', guest.photographer_id)
      .single()

    if (photographerError) {
      console.error('Error fetching photographer:', photographerError)
      return NextResponse.json(
        { error: 'Error fetching photographer information' },
        { status: 500 }
      )
    }

    const response: GalleryResponse = {
      guest,
      photos: photos || [],
      photographer: {
        id: photographer.id,
        name: photographer.name,
        branding: photographer.branding,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Gallery API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: guestId } = await params

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate request body
    const validation = validateRequestBody(body, updateGuestSchema)
    if (!validation.success) {
      return validation.response
    }

    const supabase = await createClient()

    // Verify guest exists
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id')
      .eq('id', guestId)
      .single()

    if (guestError || !guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    // Update guest information (e.g., name, email)
    const { name, email } = validation.data
    const { data: updatedGuest, error: updateError } = await supabase
      .from('guests')
      .update({
        name,
        email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', guestId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating guest:', updateError)
      return NextResponse.json(
        { error: 'Error updating guest information' },
        { status: 500 }
      )
    }

    return NextResponse.json({ guest: updatedGuest })
  } catch (error) {
    console.error('Gallery update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
