const { PrismaClient } = require('@prisma/client');

async function debugDatabase() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    console.log('🔍 DEBUG DATABASE CONNECTION');
    console.log('Database URL:', process.env.DATABASE_URL);
    
    // Try a simple count first
    const companyCount = await prisma.company.count();
    console.log('Company count:', companyCount);
    
    // Try to get all companies with minimal fields
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        tradingName: true,
        legalName: true,
        status: true
      }
    });
    
    console.log('Companies found:', companies);
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDatabase();