import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Получаем client_id из заголовков
    const clientId = request.headers.get('x-client-id')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 401 }
      )
    }

    // Получаем всех гостей клиента
    const { data: guests, error } = await supabase
      .from('guests')
      .select(`
        id,
        name,
        email,
        created_at,
        client_id,
        photos:photos(count)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching guests:', error)
      return NextResponse.json(
        { error: 'Error fetching guests' },
        { status: 500 }
      )
    }

    // Получаем количество фото для каждого гостя
    const guestsWithPhotoCount = await Promise.all(
      (guests || []).map(async (guest) => {
        const { count } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .eq('guest_id', guest.id)
          .eq('client_id', clientId)

        return {
          ...guest,
          photosCount: count || 0,
        }
      })
    )

    return NextResponse.json({
      guests: guestsWithPhotoCount,
      total: guestsWithPhotoCount.length,
    })
  } catch (error) {
    console.error('Admin guests API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Guest name is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Получаем client_id из заголовков
    const clientId = request.headers.get('x-client-id')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 401 }
      )
    }

    // Создаем уникальный ID для гостя
    const guestId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

    // Создаем гостя
    const { data: guest, error } = await supabase
      .from('guests')
      .insert({
        id: guestId,
        name: name.trim(),
        client_id: clientId,
        email: null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating guest:', error)
      return NextResponse.json(
        { error: 'Error creating guest' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      guest: {
        ...guest,
        photosCount: 0,
      },
    })
  } catch (error) {
    console.error('Create guest API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
