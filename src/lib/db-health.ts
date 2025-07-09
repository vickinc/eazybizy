import { prisma } from './prisma'

interface DatabaseHealth {
  isConnected: boolean
  responseTime: number
  error?: string
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const startTime = Date.now()
  
  try {
    // Simple query to test connectivity
    await prisma.$queryRaw`SELECT 1 as test`
    
    const responseTime = Date.now() - startTime
    
    return {
      isConnected: true,
      responseTime,
    }
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime
    
    return {
      isConnected: false,
      responseTime,
      error: error.message || 'Unknown database error',
    }
  }
}

export async function optimizeConnection(): Promise<void> {
  try {
    // Warm up the connection pool
    await prisma.$connect()
  } catch (error: unknown) {
    console.error('Failed to warm up database connection:', error.message)
  }
}

export async function gracefulDisconnect(): Promise<void> {
  try {
    await prisma.$disconnect()
  } catch (error: unknown) {
    console.error('Error during database disconnect:', error.message)
  }
}