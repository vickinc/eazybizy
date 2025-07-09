#!/usr/bin/env tsx

/**
 * Script to fix company logos that may be showing as numbers or invalid data
 * This script will update all companies in the database to ensure logos are either:
 * - Valid image URLs (starting with data: or containing http)
 * - Proper text initials (2-3 letters from trading name)
 */

import { prisma } from '@/lib/prisma'
import { CompanyBusinessService } from '@/services/business/companyBusinessService'

async function fixCompanyLogos() {
  
  try {
    // Get all companies from database
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        tradingName: true,
        logo: true,
      },
    })


    let fixedCount = 0
    let skippedCount = 0

    for (const company of companies) {
      const currentLogo = company.logo
      const validatedLogo = CompanyBusinessService.validateAndFixLogo(
        currentLogo, 
        company.tradingName
      )

      // Only update if the logo changed
      if (currentLogo !== validatedLogo) {
        await prisma.company.update({
          where: { id: company.id },
          data: { logo: validatedLogo },
        })

        fixedCount++
      } else {
        skippedCount++
      }
    }


  } catch (error) {
    console.error('❌ Error fixing company logos:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script if called directly
if (require.main === module) {
  fixCompanyLogos()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}

export { fixCompanyLogos }