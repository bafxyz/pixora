import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Получаем всех клиентов
    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        id,
        name,
        email,
        created_at,
        guests:guests(count),
        photos:photos(count),
        orders:orders(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json(
        { error: 'Error fetching clients' },
        { status: 500 }
      )
    }

    // Получаем статистику для каждого клиента
    const clientsWithStats = await Promise.all(
      (clients || []).map(async (client) => {
        // Считаем гостей
        const { count: guestsCount } = await supabase
          .from('guests')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)

        // Считаем фото
        const { count: photosCount } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)

        // Считаем заказы
        const { count: ordersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)

        return {
          ...client,
          guestsCount: guestsCount || 0,
          photosCount: photosCount || 0,
          ordersCount: ordersCount || 0,
        }
      })
    )

    return NextResponse.json({
      clients: clientsWithStats,
      total: clientsWithStats.length,
    })
  } catch (error) {
    console.error('Super admin clients API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json()

    if (!name || !name.trim() || !email || !email.trim()) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Проверяем, существует ли клиент с таким email
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email.trim())
      .single()

    if (existingClient) {
      return NextResponse.json(
        { error: 'Client with this email already exists' },
        { status: 409 }
      )
    }

    // Создаем нового клиента
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        name: name.trim(),
        email: email.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      return NextResponse.json(
        { error: 'Error creating client' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      client: {
        ...client,
        guestsCount: 0,
        photosCount: 0,
        ordersCount: 0,
      },
    })
  } catch (error) {
    console.error('Create client API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
