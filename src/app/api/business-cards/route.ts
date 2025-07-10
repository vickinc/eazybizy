import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService';

// GET /api/business-cards - Get business cards with pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const companyId = searchParams.get('companyId');
    const isArchived = searchParams.get('isArchived');
    const template = searchParams.get('template');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: unknown = {};
    
    if (companyId && companyId !== 'all') {
      where.companyId = parseInt(companyId);
    }
    
    if (isArchived !== null && isArchived !== undefined) {
      where.isArchived = isArchived === 'true';
    }
    
    if (template && template !== 'all') {
      where.template = template.toUpperCase();
    }
    
    if (search) {
      where.OR = [
        { personName: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get business cards with company information
    const [businessCards, total] = await Promise.all([
      prisma.businessCard.findMany({
        where,
        include: {
          company: true
        },
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.businessCard.count({ where })
    ]);

    return NextResponse.json({
      businessCards: businessCards.map(card => ({
        ...card,
        qrValue: card.qrType === 'WEBSITE' ? card.company.website : card.company.email
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching business cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business cards', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/business-cards - Create new business card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, personName, position, personEmail, personPhone, qrType, template } = body;

    // Validate required fields
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) },
      select: { id: true, email: true, website: true }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Determine QR value based on type - use person email if available, otherwise company email
    const qrValue = qrType?.toUpperCase() === 'WEBSITE' 
      ? company.website 
      : (personEmail || company.email);

    // Create business card
    const businessCard = await prisma.businessCard.create({
      data: {
        companyId: parseInt(companyId),
        personName: personName || '',
        position: position || '',
        personEmail: personEmail || '',
        personPhone: personPhone || '',
        qrType: qrType?.toUpperCase() || 'WEBSITE',
        qrValue,
        template: template?.toUpperCase() || 'MODERN'
      },
      include: {
        company: true
      }
    });

    // Invalidate business cards caches after creation
    await CacheInvalidationService.invalidateOnBusinessCardMutation(businessCard.id, companyId);

    return NextResponse.json(businessCard);

  } catch (error) {
    console.error('Error creating business card:', error);
    return NextResponse.json(
      { error: 'Failed to create business card' },
      { status: 500 }
    );
  }
}