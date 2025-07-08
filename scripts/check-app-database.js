// This script simulates how the Next.js app connects to the database
process.env.DATABASE_URL = "file:./prisma/dev.db";

const { PrismaClient } = require('@prisma/client');

async function checkAppDatabase() {
  console.log('🔍 CHECKING APP DATABASE CONNECTION');
  console.log('Current working directory:', process.cwd());
  console.log('DATABASE_URL from env:', process.env.DATABASE_URL);
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    // Test connection
    console.log('\n📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connected successfully');
    
    // Check companies
    console.log('\n🏢 Checking companies...');
    const companies = await prisma.company.findMany();
    console.log(`Found ${companies.length} companies:`, companies);
    
    // Check if tables exist
    console.log('\n📋 Checking tables...');
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'
      ORDER BY name;
    `;
    console.log('Tables found:', tables);
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAppDatabase();