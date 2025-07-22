import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService'
import { TaxApplicability } from '@/types/taxTreatment.types'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const treatment = await prisma.taxTreatment.findUnique({
      where: { id: params.id },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
            logo: true,
          },
        },
      },
    })
    
    if (!treatment) {
      return NextResponse.json(
        { error: 'Tax treatment not found' },
        { status: 404 }
      )
    }
    
    // Transform applicability from JSON string to array
    const transformedTreatment = {
      ...treatment,
      applicability: JSON.parse(treatment.applicability) as TaxApplicability[]
    }
    
    return NextResponse.json(transformedTreatment)
  } catch (error) {
    console.error('Error fetching tax treatment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tax treatment' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    // Check if treatment exists
    const existingTreatment = await prisma.taxTreatment.findUnique({
      where: { id: params.id }
    })
    
    if (!existingTreatment) {
      return NextResponse.json(
        { error: 'Tax treatment not found' },
        { status: 404 }
      )
    }
    
    // If code is being changed, check for uniqueness
    if (body.code && body.code !== existingTreatment.code) {
      const codeExists = await prisma.taxTreatment.findUnique({
        where: { code: body.code }
      })
      
      if (codeExists) {
        return NextResponse.json(
          { error: 'Tax treatment code already exists' },
          { status: 400 }
        )
      }
    }
    
    // Validate rate if provided
    if (body.rate !== undefined && (body.rate < 0 || body.rate > 100)) {
      return NextResponse.json(
        { error: 'Tax rate must be between 0 and 100' },
        { status: 400 }
      )
    }
    
    // Prepare update data
    const updateData: any = {}
    if (body.code !== undefined) updateData.code = body.code
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.rate !== undefined) updateData.rate = parseFloat(body.rate)
    if (body.category !== undefined) updateData.category = body.category
    if (body.applicability !== undefined) updateData.applicability = JSON.stringify(body.applicability)
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.isDefault !== undefined) updateData.isDefault = body.isDefault
    if (body.companyId !== undefined) updateData.companyId = body.companyId
    
    // Update the treatment
    const treatment = await prisma.taxTreatment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
            logo: true,
          },
        },
      },
    })
    
    // Transform applicability back to array for response
    const transformedTreatment = {
      ...treatment,
      applicability: JSON.parse(treatment.applicability) as TaxApplicability[]
    }
    
    // Invalidate cache
    CacheInvalidationService.invalidatePattern('tax-treatments')
    
    return NextResponse.json(transformedTreatment)
  } catch (error) {
    console.error('Error updating tax treatment:', error)
    return NextResponse.json(
      { error: 'Failed to update tax treatment' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if treatment exists
    const existingTreatment = await prisma.taxTreatment.findUnique({
      where: { id: params.id }
    })
    
    if (!existingTreatment) {
      return NextResponse.json(
        { error: 'Tax treatment not found' },
        { status: 404 }
      )
    }
    
    // TODO: Check if treatment is being used in any transactions/accounts
    // For now, we'll allow deletion
    
    // Delete the treatment
    await prisma.taxTreatment.delete({
      where: { id: params.id }
    })
    
    // Invalidate cache
    CacheInvalidationService.invalidatePattern('tax-treatments')
    
    return NextResponse.json(
      { message: 'Tax treatment deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting tax treatment:', error)
    return NextResponse.json(
      { error: 'Failed to delete tax treatment' },
      { status: 500 }
    )
  }
}