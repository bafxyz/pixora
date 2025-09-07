import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Successfully logged out',
    })
  } catch (_error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also handle GET requests for logout links/redirects
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.redirect(
        new URL('/?error=logout_failed', request.url)
      )
    }

    // Redirect to login page after logout
    return NextResponse.redirect(new URL('/login', request.url))
  } catch (_error) {
    return NextResponse.redirect(new URL('/?error=server_error', request.url))
  }
}
