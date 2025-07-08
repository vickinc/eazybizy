import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/business-cards/statistics - Get business cards statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    // Build base where clause
    const where: any = {};
    if (companyId && companyId !== 'all') {
      where.companyId = parseInt(companyId);
    }

    // Get basic counts
    const [
      totalCards,
      activeCards,
      archivedCards,
      cardsByTemplate,
      cardsByQRType,
      cardsByCompany,
      recentCards
    ] = await Promise.all([
      // Total business cards
      prisma.businessCard.count({ where }),
      
      // Active business cards
      prisma.businessCard.count({ 
        where: { ...where, isArchived: false } 
      }),
      
      // Archived business cards
      prisma.businessCard.count({ 
        where: { ...where, isArchived: true } 
      }),
      
      // Business cards by template
      prisma.businessCard.groupBy({
        by: ['template'],
        where,
        _count: { template: true }
      }),
      
      // Business cards by QR type
      prisma.businessCard.groupBy({
        by: ['qrType'],
        where,
        _count: { qrType: true }
      }),
      
      // Business cards by company (if not filtering by specific company)
      companyId && companyId !== 'all' ? [] : prisma.businessCard.groupBy({
        by: ['companyId'],
        where,
        _count: { companyId: true },
        orderBy: { _count: { companyId: 'desc' } },
        take: 10
      }),
      
      // Recent business cards (last 30 days)
      prisma.businessCard.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          }
        }
      })
    ]);

    // Get company names for the top companies
    let topCompanies: Array<{ companyId: number; companyName: string; count: number }> = [];
    if (cardsByCompany.length > 0) {
      const companyIds = cardsByCompany.map(item => item.companyId);
      const companies = await prisma.company.findMany({
        where: { id: { in: companyIds } },
        select: { id: true, tradingName: true }
      });

      topCompanies = cardsByCompany.map(item => ({
        companyId: item.companyId,
        companyName: companies.find(c => c.id === item.companyId)?.tradingName || 'Unknown',
        count: item._count.companyId
      }));
    }

    // Format statistics
    const statistics = {
      totalCards,
      activeCards,
      archivedCards,
      recentCards,
      cardsByTemplate: cardsByTemplate.map(item => ({
        template: item.template.toLowerCase(),
        count: item._count.template
      })),
      cardsByQRType: cardsByQRType.map(item => ({
        qrType: item.qrType.toLowerCase(),
        count: item._count.qrType
      })),
      topCompanies,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(statistics);

  } catch (error) {
    console.error('Error fetching business cards statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business cards statistics' },
      { status: 500 }
    );
  }
}