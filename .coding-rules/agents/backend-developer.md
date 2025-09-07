---
description: Guidelines for backend development with Next.js 15 App Router
globs: "**/*.ts, **/*.tsx, **/route.ts, **/actions.ts"
---

## Overview

This project uses **Next.js 15 with App Router** for backend functionality, leveraging Server Components, Server Actions, and Route Handlers for API endpoints. The backend integrates with Prisma ORM for data persistence and PostgreSQL database.

## Project Structure

The monorepo follows this structure:

```
.
├── apps
│   └── web                    # Next.js 15 application
│       ├── src
│       │   ├── app           # App Router structure
│       │       │   ├── api       # Route handlers
│       │   │   │   └── [endpoint]
│       │   │   │       └── route.ts
│       │   │   ├── actions  # Server actions
│       │   │   └── [...pages]
│       │   ├── components    # React components
│       │   ├── shared
│       │   │   └── lib
│       │   │       └── prisma  # Prisma client setup
│       │   └── utils         # Utilities
│       └── package.json
│       └── prisma            # Prisma schema and migrations
│           └── schema.prisma
├── packages
│   ├── ui                    # Shared UI components
│   └── typescript-config     # Shared TS configs
└── turbo.json               # Turborepo config
```

## Backend Development Patterns

### 1. Route Handlers (API Routes)

Use Route Handlers for RESTful API endpoints in `app/api/**/route.ts`:

```typescript
// app/api/photos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma/client';

export async function GET(request: NextRequest) {
  const photos = await prisma.photo.findMany({
    include: {
      guest: true,
      photographer: true,
    },
  });

  return NextResponse.json(photos);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Handle POST logic with Prisma
  return NextResponse.json({ success: true });
}
```

### 2. Server Actions

Use Server Actions for form submissions and mutations:

```typescript
// app/actions/photo-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/shared/lib/prisma/client';

export async function uploadPhoto(formData: FormData) {
  const file = formData.get('file') as File;
  const title = formData.get('title') as string;

  // Upload file to storage (implement your storage solution)
  const filePath = await uploadToStorage(file);

  // Save metadata to database
  await prisma.photo.create({
    data: {
      filePath,
      fileName: file.name,
      // Add other required fields like photographerId, clientId, etc.
    },
  });

  revalidatePath('/gallery');
}
```

## Prisma Integration

### Prisma Client Setup

Create Prisma client for database operations:

```typescript
// shared/lib/prisma/client.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Database Schema

Define your database schema in `prisma/schema.prisma`:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DIRECT_URL")
}

model User {
  id        String   @id @default(uuid()) @db.Uuid
  email     String   @unique
  name      String?
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@map("users")
}
```

## Best Practices

### 1. Data Fetching in Server Components

Fetch data directly in Server Components for better performance:

```tsx
// app/gallery/page.tsx
import { prisma } from '@/shared/lib/prisma/client';

export default async function GalleryPage() {
  const photos = await prisma.photo.findMany({
    where: {
      isSelected: true,
    },
    include: {
      guest: true,
      photographer: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="grid grid-cols-3 gap-4">
      {photos.map((photo) => (
        <img key={photo.id} src={photo.filePath} alt={photo.fileName} />
      ))}
    </div>
  );
}
```

### 2. Authentication & Authorization

Implement proper auth checks in server components and actions:

```typescript
// app/admin/layout.tsx
import { redirect } from 'next/navigation';
import { prisma } from '@/shared/lib/prisma/client';
// Import your auth solution (e.g., NextAuth, Clerk, or custom)

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Implement your authentication logic
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  return <>{children}</>;
}
```

### 3. Error Handling

Implement consistent error handling patterns:

```typescript
// app/api/photos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photo = await prisma.photo.findUnique({
      where: { id: params.id },
      include: {
        guest: true,
        photographer: true,
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(photo);
  } catch (error) {
    console.error('Error fetching photo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4. Caching & Revalidation

Use Next.js caching strategies effectively:

```typescript
// Revalidate data after mutations
import { revalidatePath, revalidateTag } from 'next/cache';

export async function updatePhoto(id: string, data: any) {
  // Update in database
  await supabase.from('photos').update(data).eq('id', id);
  
  // Revalidate specific paths
  revalidatePath('/gallery');
  revalidatePath(`/photos/${id}`);
  
  // Or revalidate by tag
  revalidateTag('photos');
}
```

### 5. Type Safety

Leverage TypeScript for end-to-end type safety with Prisma:

```typescript
// Prisma generates types automatically from your schema
import { prisma } from '@/shared/lib/prisma/client';

// Type-safe database operations
const photos = await prisma.photo.findMany({
  where: {
    isSelected: true,
  },
  include: {
    guest: true,
    photographer: true,
  },
});

// TypeScript will infer the correct types
type PhotoWithRelations = typeof photos[0];
// PhotoWithRelations includes guest and photographer relations
```

### 6. Environment Variables

Manage environment variables for Prisma:

```typescript
// .env
DATABASE_URL="postgresql://username:password@localhost:5432/database"
DIRECT_URL="postgresql://username:password@localhost:5432/database"

// For production (Supabase example)
DATABASE_URL="postgresql://postgres.isidnagykjibnuggbkdm:[YOUR-PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.isidnagykjibnuggbkdm:[YOUR-PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"

// Validate at runtime
if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL');
}
```

### 7. Middleware for Request Handling

Use middleware for auth and request handling:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Import your authentication middleware

export async function middleware(req: NextRequest) {
  // Implement your authentication logic
  const user = await getCurrentUser(req);

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Add client isolation headers
  const res = NextResponse.next();
  if (user?.clientId) {
    res.headers.set('x-client-id', user.clientId);
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/gallery/:path*'],
};
```

### 8. Database Migrations & Seeding

Manage database schema with Prisma:

```bash
# Generate migration from schema changes
npx prisma migrate dev --name add_photos_table

# Push schema changes to database
npx prisma db push

# Generate Prisma client after schema changes
npx prisma generate
```

```sql
-- Custom SQL migrations can be added to prisma/migrations
-- Prisma handles most schema changes automatically
```

### 9. Testing Backend Logic

Write tests for API routes and server actions:

```typescript
// __tests__/api/photos.test.ts
import { GET, POST } from '@/app/api/photos/route';
import { NextRequest } from 'next/server';

describe('Photos API', () => {
  test('GET returns photos list', async () => {
    const request = new NextRequest('http://localhost:3000/api/photos');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
  
  test('POST creates new photo', async () => {
    const request = new NextRequest('http://localhost:3000/api/photos', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Photo', url: 'test.jpg' }),
    });
    
    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
```

### 10. Performance Best Practices

- **Use Streaming & Suspense**: Leverage React 19 and Next.js 15 streaming
- **Optimize Database Queries**: Use proper indexes and query optimization
- **Implement Rate Limiting**: Protect API routes from abuse
- **Use Edge Runtime**: For lightweight API routes when possible
- **Cache Aggressively**: Use Next.js Data Cache and Full Route Cache

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Runtime**: Node.js >= 18
- **Language**: TypeScript 5.9
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom/Auth provider (NextAuth, Clerk, etc.)
- **Package Manager**: pnpm 9.0.0
- **Build System**: Turborepo
- **Development**: Turbopack

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run type checking
pnpm check-types

# Run linting
pnpm lint

# Format code
pnpm format

# Database commands
npx prisma studio          # Open Prisma Studio
npx prisma migrate dev     # Create and apply migrations
npx prisma generate        # Generate Prisma client
npx prisma db push         # Push schema changes to database
```

## Further Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [App Router Guide](https://nextjs.org/docs/app)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Prisma with Next.js](https://www.prisma.io/docs/getting-started/quickstart)
