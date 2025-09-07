#!/bin/bash

echo "🚀 Starting multi-tenant migration for Pixora..."

# Проверяем наличие переменных окружения
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

# Выполняем миграцию через Supabase REST API
echo "📋 Executing migration SQL..."

# Читаем SQL файл
SQL_FILE="./supabase/migrations/001_multi_tenant.sql"
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Migration file not found: $SQL_FILE"
    exit 1
fi

# Выполняем SQL через curl (если есть прямой доступ к БД)
# Или можно использовать supabase CLI

echo "✅ Migration script created!"
echo "📝 To run migration:"
echo "   1. Make sure Supabase is running: npx supabase start"
echo "   2. Execute: npx supabase db push"
echo "   3. Or run the SQL manually in Supabase dashboard"

echo ""
echo "🎯 Next steps:"
echo "   1. Run the migration"
echo "   2. Test the multi-tenant functionality"
echo "   3. Start implementing QR code system"