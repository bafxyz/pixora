# Анализ безопасности ролей пользователей - Pixora

## Обзор текущей реализации

После анализа кода платформы Pixora, я выявил следующие проблемы с безопасностью и разграничением доступа по ролям:

## 🔴 КРИТИЧЕСКИЕ ПРОБЛЕМЫ БЕЗОПАСНОСТИ

### 1. **ОТСУТСТВИЕ ПРОВЕРКИ РОЛЕЙ В API ENDPOINTS**

#### Проблема:
API endpoints не проверяют роль пользователя перед выполнением операций. Это означает, что **ЛЮБОЙ авторизованный пользователь может получить доступ к административным функциям**.

#### Уязвимые endpoints:
- `/api/super-admin/stats` - **НЕТ проверки роли super-admin**
- `/api/super-admin/clients` - **НЕТ проверки роли super-admin**
- `/api/admin/stats` - **НЕТ проверки роли admin**
- `/api/admin/guests` - **НЕТ проверки роли admin**
- `/api/admin/orders` - **НЕТ проверки роли admin**

#### Пример уязвимого кода:
```typescript
// apps/web/src/app/api/super-admin/stats/route.ts
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // ❌ НЕТ ПРОВЕРКИ РОЛИ ПОЛЬЗОВАТЕЛЯ!
    // Любой авторизованный пользователь может получить статистику всей платформы

    const stats = {
      totalClients: 0,
      totalGuests: 0,
      // ... конфиденциальные данные
    }
    // ... возврат данных
```

### 2. **Middleware защищает только навигацию, НЕ API**

#### Проблема:
Middleware проверяет роли только для навигации по страницам, но **НЕ блокирует прямые запросы к API**.

```typescript
// middleware.ts проверяет только роуты страниц:
const protectedRoutes = [
  '/photographer',
  '/admin',
  '/super-admin',
  '/dashboard',
]
// НО НЕ проверяет /api/* endpoints!
```

### 3. **Client-side проверки недостаточны**

#### Проблема:
Компоненты (Header, страницы) скрывают UI элементы на основе ролей, но это **только визуальная защита**. Злоумышленник может:
- Использовать DevTools для вызова API напрямую
- Использовать Postman/curl для обхода UI
- Изменить JavaScript в браузере

## 🛡️ РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ

### 1. Добавить middleware для проверки ролей в API

Создайте утилиту для проверки ролей:

```typescript
// apps/web/src/shared/lib/auth/role-guard.ts
import { createClient } from '@/shared/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function requireRole(
  allowedRoles: string[],
  request: Request
) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const userRole = user.user_metadata?.role || 'guest'

  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    )
  }

  return { user, userRole }
}
```

### 2. Защитить каждый API endpoint

Обновите endpoints с проверкой ролей:

```typescript
// apps/web/src/app/api/super-admin/stats/route.ts
export async function GET(request: NextRequest) {
  // ✅ Проверка роли super-admin
  const authResult = await requireRole(['super-admin'], request)
  if (authResult instanceof NextResponse) {
    return authResult // Возврат ошибки 403/401
  }

  const { user, userRole } = authResult

  // Теперь безопасно выполнять операции
  // ...
}
```

### 3. Добавить проверку client_id для admin роли

Администраторы должны видеть только данные своего клиента:

```typescript
// apps/web/src/app/api/admin/stats/route.ts
export async function GET(request: NextRequest) {
  // Проверка роли
  const authResult = await requireRole(['admin', 'super-admin'], request)
  if (authResult instanceof NextResponse) return authResult

  const { user, userRole } = authResult

  // Для admin - ограничить доступ только к своему client_id
  if (userRole === 'admin') {
    const clientId = await getUserClientId(user.id)
    // Использовать clientId для фильтрации данных
  }

  // super-admin видит всё
  if (userRole === 'super-admin') {
    // Полный доступ
  }
}
```

### 4. Обновить middleware для защиты API routes

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Защита API endpoints
  if (path.startsWith('/api/')) {
    // Проверка super-admin endpoints
    if (path.startsWith('/api/super-admin/')) {
      const userRole = user?.user_metadata?.role
      if (userRole !== 'super-admin') {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    // Проверка admin endpoints
    if (path.startsWith('/api/admin/')) {
      const userRole = user?.user_metadata?.role
      if (!['admin', 'super-admin'].includes(userRole)) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }
    }
  }

  // ... остальная логика
}
```

### 5. Реализовать Row Level Security (RLS) в Supabase

Добавьте политики безопасности в базе данных:

```sql
-- Политика для таблицы clients
CREATE POLICY "Super admins can view all clients" ON clients
  FOR SELECT
  USING (auth.jwt() ->> 'user_metadata'->>'role' = 'super-admin');

CREATE POLICY "Admins can view their own client" ON clients
  FOR SELECT
  USING (
    auth.jwt() ->> 'user_metadata'->>'role' = 'admin' AND
    id = (SELECT client_id FROM photographers WHERE email = auth.jwt() ->> 'email')
  );

-- Политика для таблицы orders
CREATE POLICY "Admins can view orders of their client" ON orders
  FOR SELECT
  USING (
    auth.jwt() ->> 'user_metadata'->>'role' = 'admin' AND
    client_id = (SELECT client_id FROM photographers WHERE email = auth.jwt() ->> 'email')
  );
```

## 📋 МАТРИЦА ДОСТУПА

| Роль | Доступные страницы | Доступные API | Видимые данные |
|------|-------------------|---------------|----------------|
| **super-admin** | Все страницы | Все API | Все данные платформы |
| **admin** | /admin, /photographer | /api/admin/*, /api/photos/* | Только данные своего client_id |
| **photographer** | /photographer | /api/photos/*, /api/qr/* | Только свои фото и гости |
| **guest** | /gallery/{id} | /api/gallery/{id} | Только своя галерея |

## 🚨 ПРИОРИТЕТ ИСПРАВЛЕНИЙ

1. **КРИТИЧНО**: Добавить проверку ролей во все API endpoints
2. **ВАЖНО**: Реализовать Row Level Security в Supabase
3. **ВАЖНО**: Обновить middleware для защиты API routes
4. **РЕКОМЕНДОВАНО**: Добавить логирование попыток несанкционированного доступа
5. **РЕКОМЕНДОВАНО**: Реализовать rate limiting для защиты от брутфорса

## ТЕКУЩИЙ СТАТУС

⚠️ **Платформа НЕ готова к production использованию**

Текущая реализация имеет критические уязвимости безопасности, которые позволяют любому авторизованному пользователю получить доступ к административным функциям и конфиденциальным данным всей платформы.

## Следующие шаги

1. Немедленно добавить проверку ролей во все API endpoints
2. Протестировать каждый endpoint с разными ролями
3. Реализовать аудит и логирование доступа
4. Провести пентест после исправлений

---

**Дата анализа**: 2025-09-21
**Статус**: 🔴 Критические проблемы безопасности обнаружены