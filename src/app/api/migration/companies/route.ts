import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Company } from '@/types/company.types'
import { CompanyBusinessService } from '@/services/business/companyBusinessService'

export async function POST(request: NextRequest) {
  try {
    const { companies } = await request.json()
    
    if (!Array.isArray(companies)) {
      return NextResponse.json(
        { error: 'Companies array is required' },
        { status: 400 }
      )
    }

    const result = {
      migrated: 0,
      skipped: 0,
      errors: [] as string[]
    }

    if (companies.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No companies to migrate',
        result
      })
    }

    // Check which companies already exist in database (by registrationNo)
    const existingCompanies = await prisma.company.findMany({
      select: { registrationNo: true }
    })
    const existingRegNos = new Set(existingCompanies.map(c => c.registrationNo))

    // Migrate each company
    for (const localCompany of companies) {
      try {
        // Skip if company already exists in database
        if (existingRegNos.has(localCompany.registrationNo)) {
          console.log(`Skipping company ${localCompany.tradingName} - already exists in database`)
          result.skipped++
          continue
        }

        // Validate and fix logo before migration
        const validatedLogo = CompanyBusinessService.validateAndFixLogo(
          localCompany.logo || '', 
          localCompany.tradingName
        );

        // Create company in database
        await prisma.company.create({
          data: {
            legalName: localCompany.legalName,
            tradingName: localCompany.tradingName,
            registrationNo: localCompany.registrationNo,
            registrationDate: localCompany.registrationDate || new Date().toISOString(),
            countryOfRegistration: localCompany.countryOfRegistration || 'Unknown',
            baseCurrency: localCompany.baseCurrency || 'USD',
            businessLicenseNr: localCompany.businessLicenseNr || null,
            vatNumber: localCompany.vatNumber || null,
            industry: localCompany.industry,
            address: localCompany.address,
            phone: localCompany.phone,
            email: localCompany.email,
            website: localCompany.website,
            status: localCompany.status,
            logo: validatedLogo,
            facebookUrl: localCompany.facebookUrl || null,
            instagramUrl: localCompany.instagramUrl || null,
            xUrl: localCompany.xUrl || null,
            youtubeUrl: localCompany.youtubeUrl || null,
            whatsappNumber: localCompany.whatsappNumber || null,
            telegramNumber: localCompany.telegramNumber || null,
          }
        })

        console.log(`✅ Migrated company: ${localCompany.tradingName}`)
        result.migrated++

      } catch (error) {
        const errorMsg = `Failed to migrate company ${localCompany.tradingName}: ${error}`
        console.error(errorMsg)
        result.errors.push(errorMsg)
      }
    }

    console.log(`🎉 Migration complete: ${result.migrated} migrated, ${result.skipped} skipped, ${result.errors.length} errors`)

    return NextResponse.json({
      success: result.errors.length === 0,
      message: `Migration complete: ${result.migrated} migrated, ${result.skipped} skipped, ${result.errors.length} errors`,
      result
    })

  } catch (error) {
    console.error('Critical migration error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}