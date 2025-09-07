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
  console.error('❌ Missing required environment variables:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('  - SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  console.error(
    '\nPlease add SUPABASE_SERVICE_ROLE_KEY to your .env.local file'
  )
  process.exit(1)
}

// Create Supabase admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Test users data
const testUsers = [
  {
    email: 'photographer@test.com',
    password: 'test1234',
    role: 'photographer',
    name: 'Test Photographer',
    metadata: {
      firstName: 'Test',
      lastName: 'Photographer',
      studioName: 'Photo Studio Pro',
    },
  },
  {
    email: 'admin@test.com',
    password: 'test1234',
    role: 'admin',
    name: 'Test Admin',
    metadata: {
      firstName: 'Test',
      lastName: 'Admin',
      studioName: 'Admin Studio',
    },
  },
  {
    email: 'guest@test.com',
    password: 'test1234',
    role: 'guest',
    name: 'Test Guest',
    metadata: {
      firstName: 'Test',
      lastName: 'Guest',
    },
  },
  {
    email: 'superadmin@test.com',
    password: 'test1234',
    role: 'super-admin',
    name: 'Test Super Admin',
    metadata: {
      firstName: 'Test',
      lastName: 'SuperAdmin',
      studioName: 'Super Admin Studio',
    },
  },
]

async function seedUsers() {
  console.log('🌱 Starting user seeding...\n')

  for (const userData of testUsers) {
    try {
      console.log(`Creating user: ${userData.email} (${userData.role})...`)

      // Try to create the user directly
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            ...userData.metadata,
            role: userData.role,
            name: userData.name,
          },
        })

      if (createError) {
        if (createError.message?.includes('already been registered')) {
          console.log(`  ⚠️  User already exists`)

          // Get list of users to find the existing one
          const {
            data: { users },
            error: listError,
          } = await supabase.auth.admin.listUsers()

          if (!listError && users) {
            const existingUser = users.find((u) => u.email === userData.email)
            if (existingUser) {
              // Update existing user's metadata
              const { error: updateError } =
                await supabase.auth.admin.updateUserById(existingUser.id, {
                  user_metadata: {
                    ...userData.metadata,
                    role: userData.role,
                    name: userData.name,
                  },
                })

              if (updateError) {
                console.error(`  ❌ Error updating user:`, updateError.message)
              } else {
                console.log(`  ✅ User metadata updated successfully`)
                console.log(`     ID: ${existingUser.id}`)
              }
            }
          }
        } else {
          console.error(`  ❌ Error creating user:`, createError.message)
        }
      } else {
        console.log(`  ✅ User created successfully`)
        console.log(`     ID: ${newUser.user?.id}`)
      }
    } catch (error) {
      console.error(`  ❌ Unexpected error for ${userData.email}:`, error)
    }
  }

  console.log('\n✨ User seeding completed!')
  console.log('\n📝 Test credentials:')
  console.log('─'.repeat(50))
  testUsers.forEach((user) => {
    console.log(`${user.role.toUpperCase()}:`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Password: ${user.password}`)
    console.log('─'.repeat(50))
  })
}

// Run the seeding
seedUsers().catch(console.error)
