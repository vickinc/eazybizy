process.env.DATABASE_URL = "file:./prisma/dev.db";

const { PrismaClient } = require('@prisma/client');

async function testRawQueries() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    console.log('🔍 TESTING RAW QUERIES');
    
    // Test 1: Raw SQL count
    console.log('\n1️⃣ Raw SQL count:');
    const countResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM companies`;
    console.log('Count result:', countResult);
    
    // Test 2: Raw SQL select
    console.log('\n2️⃣ Raw SQL select:');
    const selectResult = await prisma.$queryRaw`SELECT id, tradingName, legalName FROM companies LIMIT 5`;
    console.log('Select result:', selectResult);
    
    // Test 3: Prisma findFirst
    console.log('\n3️⃣ Prisma findFirst:');
    const findFirstResult = await prisma.company.findFirst();
    console.log('FindFirst result:', findFirstResult);
    
    // Test 4: Prisma count
    console.log('\n4️⃣ Prisma count:');
    const prismaCount = await prisma.company.count();
    console.log('Prisma count:', prismaCount);
    
    // Test 5: Check if there's a where clause issue
    console.log('\n5️⃣ Prisma findMany with explicit where:');
    const explicitWhere = await prisma.company.findMany({
      where: {
        id: {
          gte: 0 // Get all records with ID >= 0
        }
      }
    });
    console.log('Explicit where result:', explicitWhere);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRawQueries();