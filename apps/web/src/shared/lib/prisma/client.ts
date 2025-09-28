import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClient = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  errorFormat: 'pretty',
})

// Configure connection pool based on environment
const _connectionPool = {
  connectionLimit: process.env.NODE_ENV === 'production' ? 10 : 5,
  poolTimeout: 30000, // 30 seconds
  connectTimeout: 10000, // 10 seconds
}

// Apply connection pool settings if using PostgreSQL
if (
  process.env.DATABASE_URL?.startsWith('postgresql://') ||
  process.env.DATABASE_URL?.startsWith('postgres://')
) {
  // Note: Prisma doesn't directly expose connection pool settings in the client constructor
  // These would be configured in the DATABASE_URL connection string
  // Example: postgresql://user:pass@host:port/db?connection_limit=10&pool_timeout=30
}

export const prisma = globalForPrisma.prisma ?? prismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown handler
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })

  process.on('SIGINT', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}
