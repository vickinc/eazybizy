import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const client = await prisma.client.findUnique({
      where: {
        id: params.id,
      },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
            logo: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
            dueDate: true,
            issueDate: true,
            currency: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const body = await request.json()
    
    const {
      companyId,
      clientType,
      name,
      contactPersonName,
      contactPersonPosition,
      email,
      phone,
      website,
      address,
      city,
      zipCode,
      country,
      industry,
      status,
      notes,
      registrationNumber,
      vatNumber,
      passportNumber,
      dateOfBirth,
    } = body

    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: {
        companyId: companyId || null,
        clientType,
        name,
        contactPersonName,
        contactPersonPosition,
        email,
        phone,
        website,
        address,
        city,
        zipCode,
        country,
        industry,
        status,
        notes,
        registrationNumber,
        vatNumber,
        passportNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
            logo: true,
          },
        },
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    })

    // Invalidate related caches after successful update
    CacheInvalidationService.invalidateOnClientMutation(
      updatedClient.id,
      updatedClient.companyId || undefined
    ).catch(error => 
      console.error('Failed to invalidate caches after client update:', error)
    )

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Check if client has invoices
    if (client._count.invoices > 0) {
      return NextResponse.json(
        { error: 'Cannot delete client with existing invoices' },
        { status: 400 }
      )
    }

    // Delete client
    await prisma.client.delete({
      where: { id: params.id },
    })

    // Invalidate related caches after successful deletion
    CacheInvalidationService.invalidateOnClientMutation(
      params.id,
      client.companyId || undefined
    ).catch(error => 
      console.error('Failed to invalidate caches after client deletion:', error)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}