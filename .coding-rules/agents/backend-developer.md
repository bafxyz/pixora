---
description: Guidelines for backend development with Next.js 15 App Router
globs: "**/*.ts, **/*.tsx, **/route.ts, **/actions.ts"
---

## Overview

This project uses **Next.js 15 with App Router** for backend functionality, leveraging Server Components, Server Actions, and Route Handlers for API endpoints. The backend integrates with Supabase for data persistence and authentication.

## Project Structure

The monorepo follows this structure:

```
.
├── apps
│   └── web                    # Next.js 15 application
│       ├── src
│       │   ├── app           # App Router structure
│       │   │   ├── api       # Route handlers
│       │   │   │   └── [endpoint]
│       │   │   │       └── route.ts
│       │   │   ├── actions  # Server actions
│       │   │   └── [...pages]
│       │   ├── components    # React components
│       │   └── utils         # Utilities
│       │       └── supabase  # Supabase client setup
│       └── package.json
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
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('photos')
    .select('*');
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Handle POST logic
  return NextResponse.json({ success: true });
}
```

### 2. Server Actions

Use Server Actions for form submissions and mutations:

```typescript
// app/actions/photo-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export async function uploadPhoto(formData: FormData) {
  const supabase = createClient();
  
  const file = formData.get('file') as File;
  const title = formData.get('title') as string;
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('photos')
    .upload(`public/${file.name}`, file);
  
  if (error) throw error;
  
  // Save metadata to database
  await supabase.from('photos').insert({
    title,
    url: data.path,
  });
  
  revalidatePath('/gallery');
}
```

## Supabase Integration

### Server-Side Client

Create Supabase clients for server-side operations:

```typescript
// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### Client-Side Integration

```typescript
// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

## Best Practices

### 1. Data Fetching in Server Components

Fetch data directly in Server Components for better performance:

```tsx
// app/gallery/page.tsx
import { createClient } from '@/utils/supabase/server';

export default async function GalleryPage() {
  const supabase = createClient();
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false });
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {photos?.map((photo) => (
        <img key={photo.id} src={photo.url} alt={photo.title} />
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
import { createClient } from '@/utils/supabase/server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Photo not found' },
          { status: 404 }
        );
      }
      throw error;
    }
    
    return NextResponse.json(data);
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

Leverage TypeScript for end-to-end type safety:

```typescript
// types/database.ts
export type Photo = {
  id: string;
  title: string;
  url: string;
  photographer_id: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      photos: {
        Row: Photo;
        Insert: Omit<Photo, 'id' | 'created_at'>;
        Update: Partial<Omit<Photo, 'id'>>;
      };
    };
  };
};

// Use with Supabase client
import { Database } from '@/types/database';
const supabase = createClient<Database>();
```

### 6. Environment Variables

Manage environment variables properly:

```typescript
// .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key  # Server-only

// Validate at runtime
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}
```

### 7. Middleware for Edge Functions

Use middleware for auth and request handling:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin') && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
```

### 8. Database Migrations & Seeding

Manage database schema with Supabase:

```sql
-- supabase/migrations/001_create_photos.sql
CREATE TABLE photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  photographer_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Photos are viewable by everyone"
  ON photos FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own photos"
  ON photos FOR INSERT
  WITH CHECK (auth.uid() = photographer_id);
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
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
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
```

## Further Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [App Router Guide](https://nextjs.org/docs/app)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
