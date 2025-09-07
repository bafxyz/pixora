import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function listUsers() {
  console.log('📋 Fetching all users from Supabase Auth...\n')

  try {
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('❌ Error fetching users:', error.message)
      return
    }

    if (!users || users.length === 0) {
      console.log('No users found in Supabase Auth')
      return
    }

    console.log(`Found ${users.length} users:\n`)
    console.log('─'.repeat(80))

    users.forEach((user, index) => {
      console.log(`User #${index + 1}`)
      console.log(`  ID: ${user.id}`)
      console.log(`  Email: ${user.email}`)
      console.log(`  Role: ${user.user_metadata?.role || 'not set'}`)
      console.log(`  Name: ${user.user_metadata?.name || 'not set'}`)
      console.log(`  Created: ${new Date(user.created_at).toLocaleString()}`)
      console.log(
        `  Confirmed: ${user.email_confirmed_at ? '✅ Yes' : '❌ No'}`
      )
      console.log('─'.repeat(80))
    })

    // Group by roles
    console.log('\n📊 Users by Role:')
    console.log('─'.repeat(40))

    const roleGroups = users.reduce(
      (acc, user) => {
        const role = user.user_metadata?.role || 'no-role'
        if (!acc[role]) acc[role] = []
        if (user.email) {
          acc[role].push(user.email)
        }
        return acc
      },
      {} as Record<string, string[]>
    )

    Object.entries(roleGroups).forEach(([role, emails]) => {
      console.log(`${role.toUpperCase()}: ${emails.length} users`)
      emails.forEach((email) => {
        console.log(`  - ${email}`)
      })
    })
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
listUsers().catch(console.error)
