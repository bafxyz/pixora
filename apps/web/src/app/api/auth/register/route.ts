import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { validateRequestBody } from '@/shared/lib/utils/validation'
import { registerSchema } from '@/shared/lib/validations/auth.schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = validateRequestBody(body, registerSchema)
    if (!validation.success) {
      return validation.response
    }

    const { email, password, name } = validation.data

    const supabase = await createClient()

    // Создаем нового клиента для нового пользователя
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert({
        name: name || email.split('@')[0], // Используем имя или часть email
        email,
      })
      .select()
      .single()

    if (clientError) {
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      )
    }

    // Регистрируем пользователя с client_id в метаданных
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || null,
          client_id: clientData.id,
          role: 'photographer', // По умолчанию роль фотографа
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
      clientId: clientData.id,
      message:
        'Registration successful. Please check your email to confirm your account.',
    })
  } catch (_error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
