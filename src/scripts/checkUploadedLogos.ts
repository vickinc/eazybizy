#!/usr/bin/env tsx

/**
 * Script to check if any companies have uploaded logos
 */

import { prisma } from '@/lib/prisma'

async function checkUploadedLogos() {
  console.log('🔍 Checking for uploaded logos in database...')
  
  try {
    // Get companies with uploaded logos (starting with /uploads/)
    const companiesWithUploads = await prisma.company.findMany({
      where: {
        logo: {
          startsWith: '/uploads/'
        }
      },
      select: {
        id: true,
        tradingName: true,
        logo: true,
      },
    })

    console.log(`\nFound ${companiesWithUploads.length} companies with uploaded logos\n`)

    if (companiesWithUploads.length === 0) {
      console.log('No companies have uploaded logos.')
      console.log('\nLet me check all companies and their logo values:')
      
      const allCompanies = await prisma.company.findMany({
        select: {
          id: true,
          tradingName: true,
          logo: true,
        },
      })
      
      allCompanies.forEach(company => {
        console.log(`ID: ${company.id}, Name: ${company.tradingName}`)
        console.log(`  Logo value: "${company.logo}"`)
        console.log(`  Logo length: ${company.logo.length} characters`)
        if (company.logo.length > 50) {
          console.log(`  Logo preview: "${company.logo.substring(0, 50)}..."`)
        }
        console.log('---')
      })
    } else {
      companiesWithUploads.forEach(company => {
        console.log(`Company: ${company.tradingName} (ID: ${company.id})`)
        console.log(`  Logo path: "${company.logo}"`)
        console.log('---')
      })
    }

  } catch (error) {
    console.error('❌ Error checking uploaded logos:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script if called directly
if (require.main === module) {
  checkUploadedLogos()
    .then(() => {
      console.log('✅ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}

export { checkUploadedLogos }