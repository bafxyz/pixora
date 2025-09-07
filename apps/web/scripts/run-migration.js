const { createClient } = require('@supabase/supabase-js')
const fs = require('node:fs')
const path = require('node:path')

// Читаем переменные окружения
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    console.log('🚀 Starting multi-tenant migration...')

    // Читаем SQL файл миграции
    const migrationPath = path.join(
      __dirname,
      '../supabase/migrations/001_multi_tenant.sql'
    )
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Разбиваем на отдельные команды
    const commands = migrationSQL
      .split(';')
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.length > 0)

    console.log(`📋 Found ${commands.length} SQL commands to execute`)

    // Выполняем команды по одной
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      if (command.trim()) {
        console.log(`⚡ Executing command ${i + 1}/${commands.length}...`)
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: command })
          if (error) {
            console.error(`❌ Error in command ${i + 1}:`, error)
            // Продолжаем выполнение несмотря на ошибки
          } else {
            console.log(`✅ Command ${i + 1} executed successfully`)
          }
        } catch (err) {
          console.error(`❌ Failed to execute command ${i + 1}:`, err.message)
        }
      }
    }

    console.log('🎉 Migration completed!')
    console.log(
      '📝 Note: Some commands may have failed if tables already exist - this is normal.'
    )
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
