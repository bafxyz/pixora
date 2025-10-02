import { createClient } from '@/shared/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: photographerId } = await params

    // Verify photographer exists and belongs to current studio
    const { data: photographer, error: photographerError } = await supabase
      .from('photographers')
      .select('studio_id')
      .eq('id', photographerId)
      .single()

    if (photographerError || !photographer) {
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      )
    }

    // Get current user and verify studio admin access
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('studio_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.role !== 'studio-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (userData.studio_id !== photographer.studio_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get orders for this photographer
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        guests (
          id,
          name,
          email
        )
      `)
      .eq('photographer_id', photographerId)
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error in photographer orders API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
