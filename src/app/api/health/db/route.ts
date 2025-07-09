import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/db-health'

export async function GET(request: NextRequest) {
  try {
    const health = await checkDatabaseHealth()
    
    if (health.isConnected) {
      return NextResponse.json({
        status: 'healthy',
        database: 'connected',
        responseTime: health.responseTime,
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json({
        status: 'unhealthy',
        database: 'disconnected',
        error: health.error,
        responseTime: health.responseTime,
        timestamp: new Date().toISOString(),
      }, { status: 503 })
    }
  } catch (error: unknown) {
    return NextResponse.json({
      status: 'error',
      database: 'unknown',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}