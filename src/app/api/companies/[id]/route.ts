import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { CompanyBusinessService } from '@/services/business/companyBusinessService'
import { invalidateCompanyStatistics } from '@/services/cache/companyStatisticsCache'
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid company ID' },
        { status: 400 }
      )
    }
    
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        shareholders: true,
        representatives: true,
      },
    })
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(company)
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid company ID' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    const {
      legalName,
      tradingName,
      registrationNo,
      registrationDate,
      countryOfRegistration,
      baseCurrency,
      businessLicenseNr,
      vatNumber,
      industry,
      address,
      phone,
      email,
      website,
      status,
      logo,
      facebookUrl,
      instagramUrl,
      xUrl,
      youtubeUrl,
      whatsappNumber,
      telegramNumber,
      shareholders,
      representatives,
      mainContactPerson,
    } = body
    
    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    })
    
    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }
    
    // If registration number is being changed, check for conflicts
    if (registrationNo && registrationNo !== existingCompany.registrationNo) {
      const conflictingCompany = await prisma.company.findUnique({
        where: { registrationNo },
      })
      
      if (conflictingCompany) {
        return NextResponse.json(
          { error: 'A company with this registration number already exists' },
          { status: 409 }
        )
      }
    }
    
    // Build update data (only include provided fields)
    const updateData: Prisma.CompanyUpdateInput = {}
    
    if (legalName !== undefined) updateData.legalName = legalName
    if (tradingName !== undefined) updateData.tradingName = tradingName
    if (registrationNo !== undefined) updateData.registrationNo = registrationNo
    if (registrationDate !== undefined) updateData.registrationDate = new Date(registrationDate)
    if (countryOfRegistration !== undefined) updateData.countryOfRegistration = countryOfRegistration
    if (baseCurrency !== undefined) updateData.baseCurrency = baseCurrency
    if (businessLicenseNr !== undefined) updateData.businessLicenseNr = businessLicenseNr
    if (vatNumber !== undefined) updateData.vatNumber = vatNumber
    if (industry !== undefined) updateData.industry = industry
    if (address !== undefined) updateData.address = address
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email
    if (website !== undefined) updateData.website = website
    if (status !== undefined) updateData.status = status
    if (logo !== undefined) {
      // Validate and fix logo before update
      const finalTradingName = tradingName !== undefined ? tradingName : existingCompany.tradingName;
      updateData.logo = CompanyBusinessService.validateAndFixLogo(logo, finalTradingName);
    }
    if (facebookUrl !== undefined) updateData.facebookUrl = facebookUrl
    if (instagramUrl !== undefined) updateData.instagramUrl = instagramUrl
    if (xUrl !== undefined) updateData.xUrl = xUrl
    if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl
    if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber
    if (telegramNumber !== undefined) updateData.telegramNumber = telegramNumber
    if (mainContactPerson !== undefined) {
      updateData.mainContactEmail = mainContactPerson?.email
      updateData.mainContactType = mainContactPerson?.type
    }
    
    // Handle company update with sequential operations (SQLite-compatible)
    try {
      // Update the company first
      const updatedCompany = await prisma.company.update({
        where: { id },
        data: updateData,
      });

      // Handle shareholders update if provided
      if (shareholders !== undefined) {
        // Delete existing shareholders
        await prisma.shareholder.deleteMany({
          where: { companyId: id },
        });

        // Create new shareholders
        if (shareholders.length > 0) {
          await prisma.shareholder.createMany({
            data: shareholders.map((shareholder: any) => ({
              companyId: id,
              firstName: shareholder.firstName,
              lastName: shareholder.lastName,
              dateOfBirth: shareholder.dateOfBirth && shareholder.dateOfBirth.trim() ? new Date(shareholder.dateOfBirth) : null,
              nationality: shareholder.nationality || '',
              countryOfResidence: shareholder.countryOfResidence || '',
              email: shareholder.email,
              phoneNumber: shareholder.phoneNumber || '',
              ownershipPercent: shareholder.ownershipPercent,
            })),
          });
        }
      }

      // Handle representatives update if provided
      if (representatives !== undefined) {
        // Delete existing representatives
        await prisma.representative.deleteMany({
          where: { companyId: id },
        });

        // Create new representatives
        if (representatives.length > 0) {
          const representativeData = representatives.map((rep: any) => ({
            companyId: id,
            firstName: rep.firstName,
            lastName: rep.lastName,
            dateOfBirth: rep.dateOfBirth && rep.dateOfBirth.trim() ? new Date(rep.dateOfBirth) : null,
            nationality: rep.nationality || '',
            countryOfResidence: rep.countryOfResidence || '',
            email: rep.email,
            phoneNumber: rep.phoneNumber || '',
            role: rep.role,
            customRole: rep.customRole || null,
          }));
          
          await prisma.representative.createMany({
            data: representativeData,
          });
        }
      }

      // Return company with related data
      const company = await prisma.company.findUnique({
        where: { id },
        include: {
          shareholders: true,
          representatives: true,
        },
      });
      
      if (!company) {
        throw new Error('Failed to fetch updated company data');
      }
      
      // Invalidate statistics cache after updating company
      await invalidateCompanyStatistics()
      
      // Invalidate all company-related caches for immediate UI updates
      await CacheInvalidationService.invalidateOnCompanyMutation(id)
      
      return NextResponse.json(company);
    } catch (transactionError) {
      console.error('Error during sequential update:', transactionError)
      throw transactionError;
    }
  } catch (error) {
    console.error('Error updating company:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined
    })
    
    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma error code:', error.code)
      console.error('Prisma error meta:', error.meta)
      
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A company with this registration number already exists' },
          { status: 409 }
        )
      }
      
      // Handle other common Prisma errors
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Foreign key constraint violation' },
          { status: 400 }
        )
      }
      
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Record not found' },
          { status: 404 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid company ID' },
        { status: 400 }
      )
    }
    
    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    })
    
    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }
    
    // Check if company has related data using separate queries for better performance
    const [clientsCount, invoicesCount, productsCount] = await Promise.all([
      prisma.client.count({ where: { companyId: id } }),
      prisma.invoice.count({ where: { fromCompanyId: id } }),
      prisma.product.count({ where: { companyId: id } })
    ])
    
    const hasRelatedData = clientsCount > 0 || invoicesCount > 0 || productsCount > 0
    
    if (hasRelatedData) {
      return NextResponse.json(
        { 
          error: 'Cannot delete company with existing clients, invoices, or products. Please remove or transfer related data first.',
          details: {
            clients: clientsCount,
            invoices: invoicesCount,
            products: productsCount,
          }
        },
        { status: 409 }
      )
    }
    
    await prisma.company.delete({
      where: { id },
    })
    
    // Invalidate statistics cache after deleting company
    await invalidateCompanyStatistics()
    
    // Invalidate all company-related caches for immediate UI updates
    await CacheInvalidationService.invalidateOnCompanyMutation(id)
    
    return NextResponse.json(
      { message: 'Company deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting company:', error)
    
    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Cannot delete company due to existing related data' },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    )
  }
}