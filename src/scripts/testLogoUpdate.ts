#!/usr/bin/env tsx

/**
 * Script to test updating a company with an uploaded logo
 */

import { prisma } from '@/lib/prisma'

async function testLogoUpdate() {
  
  try {
    // Find a test company
    const company = await prisma.company.findFirst({
      where: {
        tradingName: 'TestCorp'
      }
    })
    
    if (!company) {
      const newCompany = await prisma.company.create({
        data: {
          legalName: 'Test Corporation Ltd',
          tradingName: 'TestCorp',
          registrationNo: 'TEST123',
          industry: 'Technology',
          address: '123 Test Street',
          phone: '+1234567890',
          email: 'test@testcorp.com',
          website: 'testcorp.com',
          status: 'Active',
          logo: 'TC'
        }
      })
    }
    
    // Simulate an uploaded logo path
    const uploadedLogoPath = '/uploads/company-logos/company-logo-1751368375254-shant3.png'
    
    // Update the company with the uploaded logo (using the correct company from above)
    const updated = await prisma.company.update({
      where: {
        id: company?.id || 1 // Use existing company ID or default to 1
      },
      data: {
        logo: uploadedLogoPath
      }
    })
    

  } catch (error) {
    console.error('❌ Error testing logo update:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script if called directly
if (require.main === module) {
  testLogoUpdate()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}

export { testLogoUpdate }