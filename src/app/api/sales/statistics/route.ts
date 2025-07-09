import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const period = searchParams.get('period') || 'thisMonth';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause for filtering
    const where: unknown = {};
    if (companyId && companyId !== 'all') {
      where.fromCompanyId = parseInt(companyId);
    }

    // Build date range filter
    const dateRange = getDateRange(period, dateFrom, dateTo);

    // Get total revenue from paid invoices
    const paidInvoicesWhere = {
      ...where,
      status: 'PAID',
      ...(dateRange && { 
        paidDate: { 
          gte: dateRange.start, 
          lte: dateRange.end 
        } 
      })
    };

    const [
      totalRevenue,
      activeClientsCount,
      activeProductsCount,
      pendingInvoicesCount,
      totalInvoicesCount,
      totalClientsCount,
      totalProductsCount,
      recentInvoices,
      topClientsByRevenue
    ] = await Promise.all([
      // Total revenue from paid invoices in the period
      prisma.invoice.aggregate({
        where: paidInvoicesWhere,
        _sum: {
          totalAmount: true
        }
      }),

      // Active clients count
      prisma.client.count({
        where: {
          ...(companyId && companyId !== 'all' && { companyId: parseInt(companyId) }),
          status: 'ACTIVE'
        }
      }),

      // Active products count  
      prisma.product.count({
        where: {
          ...(companyId && companyId !== 'all' && { companyId: parseInt(companyId) }),
          isActive: true
        }
      }),

      // Pending invoices count (sent but not paid)
      prisma.invoice.count({
        where: {
          ...where,
          status: 'SENT'
        }
      }),

      // Total invoices count
      prisma.invoice.count({
        where
      }),

      // Total clients count
      prisma.client.count({
        where: companyId && companyId !== 'all' ? { companyId: parseInt(companyId) } : {}
      }),

      // Total products count
      prisma.product.count({
        where: companyId && companyId !== 'all' ? { companyId: parseInt(companyId) } : {}
      }),

      // Recent invoices (last 10)
      prisma.invoice.findMany({
        where,
        select: {
          id: true,
          invoiceNumber: true,
          clientName: true,
          totalAmount: true,
          currency: true,
          status: true,
          issueDate: true,
          dueDate: true,
          paidDate: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }),

      // Top clients by revenue
      prisma.client.findMany({
        where: companyId && companyId !== 'all' ? { companyId: parseInt(companyId) } : {},
        select: {
          id: true,
          name: true,
          email: true,
          totalInvoiced: true,
          totalPaid: true,
          status: true
        },
        orderBy: {
          totalPaid: 'desc'
        },
        take: 5
      })
    ]);

    // Calculate additional metrics
    const averageInvoiceValue = totalInvoicesCount > 0 ? 
      (totalRevenue._sum.totalAmount || 0) / totalInvoicesCount : 0;

    const conversionRate = totalClientsCount > 0 ? 
      (activeClientsCount / totalClientsCount) * 100 : 0;

    // Get revenue trend data for the last 12 months
    const monthlyRevenue = await getMonthlyRevenueTrend(where);

    // Get invoice status breakdown
    const invoiceStatusBreakdown = await prisma.invoice.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true
      },
      _sum: {
        totalAmount: true
      }
    });

    // Get payment method usage
    const paymentMethodUsage = await prisma.paymentMethodInvoice.groupBy({
      by: ['paymentMethodId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    // Build response
    const statistics = {
      summary: {
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        activeClients: activeClientsCount,
        totalClients: totalClientsCount,
        activeProducts: activeProductsCount,
        totalProducts: totalProductsCount,
        pendingInvoices: pendingInvoicesCount,
        totalInvoices: totalInvoicesCount,
        averageInvoiceValue: Math.round(averageInvoiceValue * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        period: period,
        dateRange: dateRange ? {
          start: dateRange.start,
          end: dateRange.end
        } : null
      },
      invoiceStatusBreakdown: invoiceStatusBreakdown.map(item => ({
        status: item.status,
        count: item._count.id,
        totalValue: item._sum.totalAmount || 0,
        percentage: totalInvoicesCount > 0 ? 
          Math.round((item._count.id / totalInvoicesCount) * 10000) / 100 : 0
      })),
      monthlyRevenueTrend: monthlyRevenue,
      topClients: topClientsByRevenue.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        totalInvoiced: client.totalInvoiced,
        totalPaid: client.totalPaid,
        status: client.status,
        paymentRate: client.totalInvoiced > 0 ? 
          Math.round((client.totalPaid / client.totalInvoiced) * 10000) / 100 : 0
      })),
      recentInvoices: recentInvoices.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency,
        status: invoice.status,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        paidDate: invoice.paidDate
      })),
      insights: {
        healthScore: calculateHealthScore({
          conversionRate,
          pendingInvoicesCount,
          totalInvoicesCount,
          activeClientsCount
        }),
        recommendations: generateRecommendations({
          pendingInvoicesCount,
          activeClientsCount,
          activeProductsCount,
          conversionRate,
          totalRevenue: totalRevenue._sum.totalAmount || 0
        })
      }
    };

    return NextResponse.json(statistics);

  } catch (error) {
    console.error('Error fetching sales statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales statistics' },
      { status: 500 }
    );
  }
}

// Helper function to get date range based on period
function getDateRange(period: string, dateFrom?: string | null, dateTo?: string | null) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (period === 'custom' && dateFrom && dateTo) {
    return {
      start: new Date(dateFrom),
      end: new Date(dateTo)
    };
  }
  
  switch (period) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return { start: weekStart, end: weekEnd };
    
    case 'thisMonth':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      };
    
    case 'lastMonth':
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        start: lastMonth,
        end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      };
    
    case 'last6Months':
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 6, 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      };
    
    case 'thisYear':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
      };
    
    case 'lastYear':
      return {
        start: new Date(now.getFullYear() - 1, 0, 1),
        end: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
      };
    
    default:
      return null;
  }
}

// Helper function to get monthly revenue trend
async function getMonthlyRevenueTrend(where: unknown) {
  const thirteenMonthsAgo = new Date();
  thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);
  thirteenMonthsAgo.setDate(1);
  
  const monthlyData = await prisma.invoice.findMany({
    where: {
      ...where,
      status: 'PAID',
      paidDate: {
        gte: thirteenMonthsAgo
      }
    },
    select: {
      totalAmount: true,
      paidDate: true
    }
  });

  // Group by month
  const monthlyRevenue = monthlyData.reduce((acc: unknown, invoice) => {
    if (invoice.paidDate) {
      const monthKey = `${invoice.paidDate.getFullYear()}-${String(invoice.paidDate.getMonth() + 1).padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + invoice.totalAmount;
    }
    return acc;
  }, {});

  // Generate array for last 12 months
  const result = [];
  for (const i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    result.push({
      month: monthKey,
      revenue: monthlyRevenue[monthKey] || 0,
      monthName: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    });
  }

  return result;
}

// Helper function to calculate health score
function calculateHealthScore(metrics: {
  conversionRate: number;
  pendingInvoicesCount: number;
  totalInvoicesCount: number;
  activeClientsCount: number;
}) {
  const score = 0;
  
  // Conversion rate (40% weight)
  score += Math.min(metrics.conversionRate, 100) * 0.4;
  
  // Invoice payment rate (30% weight)
  const paymentRate = metrics.totalInvoicesCount > 0 ? 
    ((metrics.totalInvoicesCount - metrics.pendingInvoicesCount) / metrics.totalInvoicesCount) * 100 : 0;
  score += paymentRate * 0.3;
  
  // Active clients presence (30% weight)
  const clientsScore = metrics.activeClientsCount > 0 ? 
    Math.min(metrics.activeClientsCount * 10, 100) : 0;
  score += clientsScore * 0.3;
  
  return Math.round(score);
}

// Helper function to generate recommendations
function generateRecommendations(metrics: {
  pendingInvoicesCount: number;
  activeClientsCount: number;
  activeProductsCount: number;
  conversionRate: number;
  totalRevenue: number;
}) {
  const recommendations = [];
  
  if (metrics.pendingInvoicesCount > 10) {
    recommendations.push("Follow up on pending invoices to improve cash flow");
  }
  
  if (metrics.activeClientsCount === 0) {
    recommendations.push("Add clients to start generating revenue");
  } else if (metrics.activeClientsCount < 5) {
    recommendations.push("Consider expanding your client base");
  }
  
  if (metrics.activeProductsCount === 0) {
    recommendations.push("Add products or services to your catalog");
  }
  
  if (metrics.conversionRate < 50) {
    recommendations.push("Focus on converting leads to active clients");
  }
  
  if (metrics.totalRevenue === 0) {
    recommendations.push("Create and send your first invoice to generate revenue");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("Great job! Your sales metrics look healthy");
  }
  
  return recommendations;
}