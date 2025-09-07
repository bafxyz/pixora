import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { qrData } = await request.json()

    if (!qrData) {
      return NextResponse.json(
        { error: 'QR data is required' },
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

    let parsedData: Record<string, unknown>
    try {
      parsedData = JSON.parse(qrData)
    } catch (_error) {
      return NextResponse.json(
        { error: 'Invalid QR data format' },
        { status: 400 }
      )
    }

    const { id: guestId, name: guestName } = parsedData

    if (!guestId || !guestName) {
      return NextResponse.json(
        { error: 'Invalid QR data: missing guest ID or name' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли уже такой гость
    const { data: existingGuest, error: checkError } = await supabase
      .from('guests')
      .select('id, name')
      .eq('id', guestId)
      .eq('client_id', clientId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = not found
      console.error('Error checking guest:', checkError)
      return NextResponse.json(
        { error: 'Error checking guest' },
        { status: 500 }
      )
    }

    if (existingGuest) {
      // Гость уже существует
      return NextResponse.json({
        success: true,
        guest: existingGuest,
        message: 'Guest already exists',
      })
    }

    // Создаем нового гостя
    const { data: newGuest, error: createError } = await supabase
      .from('guests')
      .insert({
        id: guestId,
        name: guestName,
        client_id: clientId,
        email: null, // Можно добавить позже
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating guest:', createError)
      return NextResponse.json(
        { error: 'Error creating guest' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      guest: newGuest,
      message: 'Guest created successfully',
    })
  } catch (error) {
    console.error('QR scan API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
