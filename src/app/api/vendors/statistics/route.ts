import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    // Build where clause for filtering
    const where: unknown = {};
    if (companyId && companyId !== 'all') {
      where.companyId = parseInt(companyId);
    }

    // Get basic statistics
    const [
      totalVendors,
      activeVendors,
      inactiveVendors,
      vendorsByCountry,
      vendorsByCurrency,
      vendorsByPaymentMethod,
      recentVendors,
      topVendors
    ] = await Promise.all([
      // Total vendors
      prisma.vendor.count({ where }),
      
      // Active vendors
      prisma.vendor.count({ 
        where: { ...where, isActive: true } 
      }),
      
      // Inactive vendors  
      prisma.vendor.count({ 
        where: { ...where, isActive: false } 
      }),

      // Vendors by country
      prisma.vendor.groupBy({
        by: ['vendorCountry'],
        where,
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      }),

      // Vendors by currency
      prisma.vendor.groupBy({
        by: ['currency'],
        where,
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      }),

      // Vendors by payment method
      prisma.vendor.groupBy({
        by: ['paymentMethod'],
        where,
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      }),

      // Recent vendors (last 30 days)
      prisma.vendor.findMany({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          id: true,
          companyName: true,
          contactEmail: true,
          isActive: true,
          createdAt: true,
          company: {
            select: {
              tradingName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }),

      // Top vendors by product count
      prisma.vendor.findMany({
        where,
        select: {
          id: true,
          companyName: true,
          contactEmail: true,
          isActive: true,
          currency: true,
          _count: {
            select: {
              products: true
            }
          },
          company: {
            select: {
              tradingName: true
            }
          }
        },
        orderBy: {
          products: {
            _count: 'desc'
          }
        },
        take: 10
      })
    ]);

    // Calculate additional metrics
    const activePercentage = totalVendors > 0 ? (activeVendors / totalVendors) * 100 : 0;
    const mostPopularCountry = vendorsByCountry[0]?.vendorCountry || null;
    const mostPopularCurrency = vendorsByCurrency[0]?.currency || null;
    const mostPopularPaymentMethod = vendorsByPaymentMethod[0]?.paymentMethod || null;

    // Calculate average payment terms
    // Note: If paymentTerms is stored as string, we need to convert it to number first
    const vendorsForPaymentTerms = await prisma.vendor.findMany({
      where,
      select: {
        paymentTerms: true
      }
    });
    
    const validPaymentTerms = vendorsForPaymentTerms
      .map(v => {
        // Handle both string and number paymentTerms
        const terms = typeof v.paymentTerms === 'string' ? parseInt(v.paymentTerms) : v.paymentTerms;
        return isNaN(terms) ? 0 : terms;
      })
      .filter(terms => terms > 0);
    
    const avgPaymentTerms = validPaymentTerms.length > 0 
      ? Math.round(validPaymentTerms.reduce((sum, terms) => sum + terms, 0) / validPaymentTerms.length)
      : 0;

    // Build response
    const statistics = {
      summary: {
        totalVendors,
        activeVendors,
        inactiveVendors,
        activePercentage: Math.round(activePercentage * 100) / 100,
        mostPopularCountry,
        mostPopularCurrency,
        mostPopularPaymentMethod,
        recentVendorsCount: recentVendors.length,
        avgPaymentTerms
      },
      statusBreakdown: {
        active: {
          count: activeVendors,
          percentage: Math.round(activePercentage * 100) / 100
        },
        inactive: {
          count: inactiveVendors,
          percentage: Math.round((100 - activePercentage) * 100) / 100
        }
      },
      countryBreakdown: vendorsByCountry.map(item => ({
        country: item.vendorCountry || 'Unknown',
        count: item._count.id,
        percentage: totalVendors > 0 ? Math.round((item._count.id / totalVendors) * 10000) / 100 : 0
      })),
      currencyBreakdown: vendorsByCurrency.map(item => ({
        currency: item.currency,
        count: item._count.id,
        percentage: totalVendors > 0 ? Math.round((item._count.id / totalVendors) * 10000) / 100 : 0
      })),
      paymentMethodBreakdown: vendorsByPaymentMethod.map(item => ({
        method: item.paymentMethod,
        count: item._count.id,
        percentage: totalVendors > 0 ? Math.round((item._count.id / totalVendors) * 10000) / 100 : 0
      })),
      recentVendors: recentVendors.map(vendor => ({
        id: vendor.id,
        companyName: vendor.companyName,
        contactEmail: vendor.contactEmail,
        isActive: vendor.isActive,
        createdAt: vendor.createdAt,
        company: vendor.company?.tradingName || 'Unknown'
      })),
      topVendors: topVendors.map(vendor => ({
        id: vendor.id,
        companyName: vendor.companyName,
        contactEmail: vendor.contactEmail,
        isActive: vendor.isActive,
        currency: vendor.currency,
        productCount: vendor._count.products,
        company: vendor.company?.tradingName || 'Unknown'
      })),
      insights: {
        healthScore: Math.round(activePercentage),
        recommendations: [
          activeVendors === 0 ? "Consider adding vendors to your database" : null,
          inactiveVendors > activeVendors ? "Review and reactivate inactive vendors" : null,
          recentVendors.length === 0 ? "No new vendors added recently" : null
        ].filter(Boolean)
      }
    };

    return NextResponse.json(statistics);

  } catch (error) {
    console.error('Error fetching vendor statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor statistics' },
      { status: 500 }
    );
  }
}