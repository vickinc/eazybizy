#!/usr/bin/env tsx

/**
 * Script to check company logos in the database
 */

import { prisma } from '@/lib/prisma'

async function checkCompanyLogos() {
  console.log('🔍 Checking company logos in database...')
  
  try {
    // Get all companies from database
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        tradingName: true,
        logo: true,
      },
    })

    console.log(`\nFound ${companies.length} companies\n`)

    for (const company of companies) {
      console.log(`Company: ${company.tradingName} (ID: ${company.id})`)
      console.log(`  Logo: "${company.logo}"`)
      console.log(`  Logo type: ${
        company.logo.startsWith('data:') ? 'Data URL' :
        company.logo.includes('http') ? 'HTTP URL' :
        company.logo.startsWith('/uploads/') ? 'Uploaded file' :
        /^[A-Za-z]{1,3}$/.test(company.logo) ? 'Text initials' :
        'Unknown/Invalid'
      }`)
      console.log('---')
    }

  } catch (error) {
    console.error('❌ Error checking company logos:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script if called directly
if (require.main === module) {
  checkCompanyLogos()
    .then(() => {
      console.log('✅ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}

export { checkCompanyLogos }