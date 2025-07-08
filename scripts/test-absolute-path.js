// Test with absolute path
process.env.DATABASE_URL = "file:///Users/viktorj/Desktop/ClaudeCode/Refactored/portalpro-app/prisma/dev.db";

const { PrismaClient } = require('@prisma/client');

async function testAbsolutePath() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    console.log('🔍 TESTING WITH ABSOLUTE PATH');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    const count = await prisma.company.count();
    console.log('Company count:', count);
    
    const companies = await prisma.company.findMany();
    console.log('Companies:', companies);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAbsolutePath();