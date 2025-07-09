#!/usr/bin/env tsx

/**
 * Script to check if any companies have uploaded logos
 */

import { prisma } from '@/lib/prisma'

async function checkUploadedLogos() {
  
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


    if (companiesWithUploads.length === 0) {
      
      const allCompanies = await prisma.company.findMany({
        select: {
          id: true,
          tradingName: true,
          logo: true,
        },
      })
      
      allCompanies.forEach(company => {
        if (company.logo.length > 50) {
        }
      })
    } else {
      companiesWithUploads.forEach(company => {
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
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}

export { checkUploadedLogos }