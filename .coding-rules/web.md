# Web App

## Overview

The web application is part of a Turborepo monorepo and follows a **feature-based architecture**. This Next.js 15 application leverages React 19, TypeScript, and Tailwind CSS 4 for modern web development.

## Project Structure

```
apps/web/
├── src/
│   ├── app/              # App Router pages and layouts
│   ├── components/       # Feature-specific components
│   ├── features/         # Feature modules (recommended structure)
│   ├── lib/              # Utilities and shared logic
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
└── package.json          # Web app dependencies
```

## Feature-Based Organization

Organize code by **features** rather than technical layers:

```
src/features/
├── auth/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── types.ts
├── dashboard/
│   ├── components/
│   ├── hooks/
│   └── services/
└── profile/
    ├── components/
    ├── hooks/
    └── services/
```

## Available Commands

### Development
```bash
# Start development server (from monorepo root)
pnpm --filter=web run dev

# Start only web app (from apps/web)
pnpm dev
```

### Building
```bash
# Build all apps and packages (from root)
pnpm build

# Build only web app (from apps/web)
pnpm --filter=web build
```

### Code Quality
```bash
# Run linting
pnpm --filter=web lint

# Format code
pnpm --filter=web format

# Type checking
pnpm --filter=web check-types
```

### Production
```bash
# Start production server (from apps/web)
pnpm start
```

## Environment Setup

1. **Prerequisites**: Node.js ≥18, pnpm 9.0.0+
2. **Install dependencies**: `pnpm install` (from root)
3. **Start development**: `pnpm dev`
4. **Access**: http://localhost:3000

## Monorepo Integration

- **Shared UI**: Import components from `@repo/ui`
- **TypeScript Config**: Extends `@repo/typescript-config`
- **Build System**: Uses Turborepo for optimized builds
- **Package Management**: pnpm workspaces for dependency management
