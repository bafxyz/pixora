const fs = require('node:fs')
const path = require('node:path')

// Читаем SQL файл
const migrationPath = path.join(
  __dirname,
  '../supabase/migrations/001_multi_tenant.sql'
)
const sql = fs.readFileSync(migrationPath, 'utf8')

console.log('📋 SQL Migration for Multi-tenant Architecture:')
console.log('='.repeat(50))
console.log(sql)
console.log('='.repeat(50))
console.log('')
console.log('🚀 To execute this migration:')
console.log('1. Go to https://supabase.com/dashboard')
console.log('2. Open your project')
console.log('3. Go to SQL Editor')
console.log('4. Copy and paste the SQL above')
console.log('5. Click "Run"')
console.log('')
console.log('⚠️  Important: Make sure to backup your data first!')
console.log(
  '📝 This will add client_id to all tables and create the clients table'
)
