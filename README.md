# VC Next.js Monorepo

🧙‍♂️ **Be magical!**

## About This Project

This is a modern monorepo starter kit built with Next.js, designed for AI-powered development workflows. The project features a scalable architecture with separate packages for UI components and backend services, optimized for "vibe coding" - a development approach that maximizes AI assistance throughout the entire development lifecycle.

## Key Features

- **🏗️ Turborepo Monorepo**: Efficient build system and package management
- **⚡ Next.js 15**: Latest React framework with Turbopack support
- **🎨 Shared UI Components**: Reusable component library across apps
- **🤖 AI-First Workflow**: Designed for seamless AI agent integration
- **📦 Modern Tooling**: TypeScript, Biome for formatting and linting
- **🔧 Developer Experience**: Hot reload, type checking, and optimized builds

## Architecture

```
vc-nextjs/
├── apps/
│   └── web/                 # Next.js web application
├── packages/
│   ├── ui/                  # Shared UI components
│   └── typescript-config/   # Shared TypeScript configurations
└── tools & configs
```

## AI-Powered Development Workflow

This project is designed to maximize AI utilization in your development process:

1. **Task Creation**: Create detailed tasks in GitHub Issues
2. **Agent Assignment**: Assign tasks to specialized AI agents (Frontend, Backend, QA)
3. **Environment Setup**: Automated setup of services, databases, and dependencies
4. **Development Cycle**: AI handles planning, implementation, testing, and code review
5. **Quality Assurance**: Automated testing and validation

## Prerequisites

- **Node.js**: ≥18.0.0
- **pnpm**: 9.0.0+ (package manager)
- **GitHub CLI**: For AI agent integration

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd vc-nextjs
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all applications in development mode |
| `pnpm build` | Build all applications and packages |
| `pnpm lint` | Run linting across all packages |
| `pnpm check-types` | Run TypeScript type checking |
| `pnpm format` | Format code using Biome |

## Project Structure

### Apps
- **web**: Main Next.js application with React 19 and modern tooling

### Packages
- **ui**: Shared React component library (Button, Card, Code components)
- **typescript-config**: Shared TypeScript configurations for different environments

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.9
- **UI**: React 19 with custom component library
- **Build System**: Turborepo with Turbopack
- **Code Quality**: Biome (formatting + linting)
- **Package Manager**: pnpm with workspaces

## GitHub CLI Integration

This project leverages GitHub CLI for seamless AI agent workflows:

- **Installation**: [https://cli.github.com/](https://cli.github.com/)
- **Usage**: Create issues, manage PRs, and coordinate with AI agents
- **Automation**: Streamlined task assignment and project management

## Contributing

1. Create a GitHub issue describing your task
2. Assign the issue to the appropriate AI agent (FE/BE/QA)
3. Let the AI handle environment setup and implementation
4. Review and merge the automated pull requests

## Development Workflow

The AI-powered development cycle includes:

- **Planning**: Automated task breakdown and architecture decisions
- **Implementation**: Code generation with best practices
- **Testing**: Automated test creation and execution
- **Review**: AI-powered code review and optimization
- **Deployment**: Automated build and deployment processes

---

**Ready to build something magical?** Start by creating your first GitHub issue and let the AI agents handle the rest! 🚀