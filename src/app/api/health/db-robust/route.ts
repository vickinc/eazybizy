import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry, getWorkingPrismaConnection } from '@/lib/prisma-connection'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Test the robust connection system
    const result = await executeWithRetry(async (prisma) => {
      const [testQuery, companies, businessCards] = await Promise.all([
        prisma.$queryRaw`SELECT 1 as test, NOW() as timestamp`,
        prisma.company.count(),
        prisma.businessCard.count()
      ])
      
      return {
        testQuery,
        counts: {
          companies,
          businessCards
        }
      }
    })
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'healthy',
      message: 'Robust database connection working',
      responseTime,
      timestamp: new Date().toISOString(),
      data: result
    })
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'error',
      message: 'All database connections failed',
      error: error.message,
      responseTime,
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}