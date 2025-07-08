import { PrismaClient } from '@prisma/client'

// Single connection configuration using DATABASE_URL from environment
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
    transactionOptions: {
      timeout: 30000, // 30 second timeout
      maxWait: 5000,  // Max wait time for connection from pool
      isolationLevel: 'ReadCommitted',
    },
  })

// Handle database connection errors gracefully
prisma.$on('error', (e) => {
  console.error('Prisma error:', e)
})

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Enhanced query execution with automatic retry
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // If it's a connection error, retry
      if (error.code === 'P1001' || error.code === 'P2024') {
        console.warn(`Database operation failed (attempt ${attempt + 1}/${maxRetries + 1})`)
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        }
      } else {
        // Non-connection error, don't retry
        throw error
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded')
}

// Export as default for compatibility
export default prisma