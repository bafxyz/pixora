# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Development Commands

Use these commands for common development tasks:

- **Install dependencies**: `pnpm install`
- **Development server**: `pnpm dev` (starts all apps with hot reload)
- **Build all packages**: `pnpm build`
- **Type checking**: `pnpm check-types` (runs TypeScript validation across monorepo)
- **Linting**: `pnpm lint` (runs Biome linter/formatter checks)
- **Code formatting**: `pnpm format` (auto-format with Biome)

### App-specific Commands

Navigate to `apps/web/` for app-specific operations:
- **Web app dev**: `pnpm dev` (uses Turbopack, port 3000)
- **Production build**: `pnpm build` 
- **Production start**: `pnpm start`
- **Type checking**: `pnpm check-types`
- **Linting**: `pnpm lint`

### Package-specific Commands

Navigate to `packages/ui/` for UI component development:
- **Generate component**: `pnpm generate:component` (Turbo generator for React components)
- **Type checking**: `pnpm check-types`
- **Linting**: `pnpm lint`

## Architecture Overview

This is a **Turborepo monorepo** with the following structure:

### Apps
- **`apps/web/`**: Next.js 15 application with App Router and React 19
  - Uses Turbopack for development builds
  - Consumes shared UI components from `@repo/ui`
  - TypeScript with shared configs from `@repo/typescript-config`
### Packages

- **`packages/ui/`**: Shared React component library
  - Exports components via `./src/*.tsx` pattern
  - Currently includes: Button, Card, Code components
  - Uses workspace dependencies for React/TypeScript
  
- **`packages/typescript-config/`**: Shared TypeScript configurations
  - Provides consistent TS configs across apps and packages

## Technology Stack

- **Build System**: Turborepo with workspace dependencies
- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript 5.9 with strict type checking
- **UI**: React 19 with custom component library
- **Package Manager**: pnpm with workspaces (`packageManager: "pnpm@9.0.0"`)
- **Code Quality**: Biome for linting and formatting (replaces ESLint/Prettier)
- **Node Version**: ≥18.0.0

## Code Standards

### Biome Configuration
- **Formatting**: 2-space indents, single quotes, trailing commas, 80 char lines
- **File naming**: kebab-case preferred (warn level)
- **Import style**: Use `import type` for types
- **JSX Runtime**: React classic
- **Lint rules**: Recommended + Next.js + React domains enabled

### Component Development
- UI components use `'use client'` directive when needed
- Follow existing component patterns in `packages/ui/src/`
- Export pattern: `export const ComponentName = ({ props }) => { ... }`
- TypeScript interfaces for component props

## Workspace Dependencies

Internal packages use `workspace:*` pattern:
- `@repo/ui` for shared components
- `@repo/typescript-config` for TS configurations

Always check existing workspace dependencies before adding external packages.

## Environment Configuration

### Required Environment Variables
The project uses Supabase for backend services. Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `NEXT_PUBLIC_APP_URL`: Application URL (defaults to localhost:3000)
- `NEXT_PUBLIC_APP_NAME`: Application name (defaults to "Photography Gallery")

### Environment Setup
1. Copy `.env.example` to `.env.local` in `apps/web/`
2. Fill in your Supabase credentials
3. Environment variables are automatically loaded by Next.js

### Middleware Environment Variables
**Important**: Next.js middleware runs in Edge Runtime with different environment variable behavior:
- Use `process.env.VARIABLE_NAME` directly in middleware
- Avoid importing the `env` config object in middleware files
- Always check for variable existence before using them

## AI Development Workflow

This project is optimized for AI-powered development:
- Task creation via GitHub Issues
- Specialized AI agent assignment (Frontend/Backend/QA)
- Automated environment setup and dependency management
- GitHub CLI integration for streamlined workflows

When implementing features, follow the monorepo structure and leverage existing shared packages before creating new dependencies.