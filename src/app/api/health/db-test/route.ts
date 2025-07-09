import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const testConnections = [
  {
    name: 'Pooler Connection',
    url: "postgresql://postgres.ftmxjfmkbgooupesovtl:VNFGiivGgo7XZFQ6@aws-0-eu-central-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=5&pool_timeout=10&connect_timeout=15"
  },
  {
    name: 'Direct Connection (db subdomain)',
    url: "postgresql://postgres.ftmxjfmkbgooupesovtl:VNFGiivGgo7XZFQ6@db.ftmxjfmkbgooupesovtl.supabase.co:5432/postgres?sslmode=require&connect_timeout=15"
  },
  {
    name: 'Direct Connection (main domain)',
    url: "postgresql://postgres.ftmxjfmkbgooupesovtl:VNFGiivGgo7XZFQ6@ftmxjfmkbgooupesovtl.supabase.co:5432/postgres?sslmode=require&connect_timeout=15"
  }
]

async function testConnection(connectionUrl: string, name: string) {
  const startTime = Date.now()
  let prisma: PrismaClient | null = null
  
  try {
    prisma = new PrismaClient({
      datasources: {
        db: { url: connectionUrl }
      },
      log: ['error']
    })
    
    // Test the connection
    await prisma.$queryRaw`SELECT 1 as test`
    
    const responseTime = Date.now() - startTime
    
    return {
      name,
      status: 'success',
      responseTime,
      error: null
    }
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime
    
    return {
      name,
      status: 'failed',
      responseTime,
      error: error.message || 'Unknown error'
    }
  } finally {
    if (prisma) {
      await prisma.$disconnect().catch(() => {})
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    
    const results = []
    
    for (const connection of testConnections) {
      const result = await testConnection(connection.url, connection.name)
      results.push(result)
      
      // If we found a working connection, stop testing
      if (result.status === 'success') {
        break
      }
    }
    
    const workingConnection = results.find(r => r.status === 'success')
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      summary: workingConnection ? 'Found working connection' : 'No working connections found',
      workingConnection: workingConnection?.name || null,
      allResults: results
    })
    
  } catch (error: unknown) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      summary: 'Test failed',
      error: error.message,
      allResults: []
    }, { status: 500 })
  }
}