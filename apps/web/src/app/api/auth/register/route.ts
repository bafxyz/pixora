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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || null,
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
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
