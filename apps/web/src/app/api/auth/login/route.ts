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

    return NextResponse.json({
      user: data.user,
      session: data.session,
    })
  } catch (_error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
