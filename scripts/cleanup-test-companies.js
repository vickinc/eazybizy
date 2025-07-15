const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupTestCompanies() {
  console.log('🧹 Cleaning up test companies...')
  
  try {
    // Delete companies with test registration numbers
    const result = await prisma.company.deleteMany({
      where: {
        registrationNo: {
          startsWith: '12345'
        }
      }
    })

    console.log(`✅ Successfully deleted ${result.count} test companies!`)

  } catch (error) {
    console.error('❌ Error cleaning up test companies:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
cleanupTestCompanies()