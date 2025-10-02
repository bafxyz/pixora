import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { withRoleCheck } from '@/shared/lib/auth/role-guard'
import { prisma } from '@/shared/lib/prisma/client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables for Supabase')
}

// Admin client for deleting users
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only admin can delete
  const auth = await withRoleCheck(['admin'], request)
  if (auth instanceof NextResponse) {
    return auth
  }

  try {
    const { id } = await params

    // Find studio admin
    const studioAdmin = await prisma.studioAdmin.findUnique({
      where: { id },
    })

    if (!studioAdmin) {
      return NextResponse.json(
        { error: 'Studio admin not found' },
        { status: 404 }
      )
    }

    // Find corresponding Supabase auth user
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = users?.users.find(
      (u) => u.email === studioAdmin.email.toLowerCase()
    )

    // Delete from database first
    await prisma.studioAdmin.delete({
      where: { id },
    })

    // Then delete from Supabase auth if exists
    if (authUser) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Studio admin deleted successfully',
    })
  } catch (error) {
    console.error('Studio admin deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete studio admin' },
      { status: 500 }
    )
  }
}
