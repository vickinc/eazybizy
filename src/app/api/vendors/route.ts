import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '50');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || 'all';
    const company = searchParams.get('company') || 'all';
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortDirection = searchParams.get('sortDirection') || 'desc';

    // Build where clause
    const where: any = {};
    
    // Company filter
    if (company !== 'all') {
      where.companyId = parseInt(company);
    }
    
    // Status filter
    if (status !== 'all') {
      where.isActive = status === 'active';
    }
    
    // Search filter
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { itemsServicesSold: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortField] = sortDirection;

    // Fetch vendors with pagination
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          company: {
            select: {
              id: true,
              tradingName: true,
              legalName: true,
              logo: true
            }
          },
          products: {
            select: {
              id: true,
              name: true,
              price: true,
              currency: true
            }
          }
        }
      }),
      prisma.vendor.count({ where })
    ]);

    // Calculate statistics for the current filters
    const statistics = await prisma.vendor.groupBy({
      by: ['isActive'],
      where,
      _count: {
        id: true
      }
    });

    const statusStats = {
      total: total,
      active: statistics.find(s => s.isActive)?._count.id || 0,
      inactive: statistics.find(s => !s.isActive)?._count.id || 0
    };

    return NextResponse.json({
      data: vendors,
      pagination: {
        total,
        skip,
        take,
        hasMore: skip + take < total
      },
      statistics: statusStats
    });

  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.companyId || !body.companyName || !body.contactEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: companyId, companyName, contactEmail' },
        { status: 400 }
      );
    }

    // Create vendor
    const vendor = await prisma.vendor.create({
      data: {
        companyId: body.companyId,
        companyName: body.companyName,
        contactPerson: body.contactPerson,
        contactEmail: body.contactEmail,
        phone: body.phone,
        website: body.website,
        paymentTerms: body.paymentTerms || '30',
        currency: body.currency || 'USD',
        paymentMethod: body.paymentMethod || 'Bank',
        billingAddress: body.billingAddress,
        itemsServicesSold: body.itemsServicesSold,
        notes: body.notes,
        companyRegistrationNr: body.companyRegistrationNr,
        vatNr: body.vatNr,
        vendorCountry: body.vendorCountry,
        isActive: body.isActive !== undefined ? body.isActive : true
      },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
            logo: true
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            currency: true
          }
        }
      }
    });

    // Invalidate vendor caches after successful creation
    CacheInvalidationService.invalidateOnVendorMutation(vendor.id, vendor.companyId).catch(error => 
      console.error('Failed to invalidate caches after vendor creation:', error)
    );

    return NextResponse.json(vendor, { status: 201 });

  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}