import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Optimize connection pooling
    transactionOptions: {
      timeout: 30000, // 30 second timeout
      maxWait: 5000,  // Max wait time for connection from pool
      isolationLevel: 'ReadCommitted', // Optimize for performance
    },
  })

// Handle database connection errors gracefully
prisma.$on('error', (e) => {
  console.error('Prisma error:', e)
})

// Improve connection reliability with retry logic
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await operation()
  } catch (error: unknown) {
    if (retries > 0 && (error.code === 'P1001' || error.code === 'P2024')) {
      console.warn(`Database operation failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return executeWithRetry(operation, retries - 1)
    }
    throw error
  }
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma