import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { validateRequestBody } from '@/shared/lib/utils/validation'
import { loginSchema } from '@/shared/lib/validations/auth.schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = validateRequestBody(body, loginSchema)
    if (!validation.success) {
      return validation.response
    }

    const { email, password } = validation.data

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // Получаем информацию о клиенте пользователя
    const user = data.user
    let clientId = user?.user_metadata?.client_id

    // Если client_id не указан в метаданных, ищем его в таблице clients
    if (!clientId && user?.email) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('email', user.email)
        .single()

      if (clientData) {
        clientId = clientData.id
      }
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
      clientId,
    })
  } catch (_error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
