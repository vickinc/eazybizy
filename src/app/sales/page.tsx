"use client";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, 
  Building2, 
  FileText,
  ShoppingCart,
  Plus,
  Users,
  DollarSign,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { salesApiService, SalesStatistics } from "@/services/api/salesApiService";

type RevenuePeriod = 'today' | 'week' | 'thisMonth' | 'lastMonth' | 'last6Months' | 'thisYear' | 'lastYear';

export default function SalesPage() {
  const { selectedCompany: globalSelectedCompany } = useCompanyFilter();
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('thisMonth');

  // Fetch sales statistics with React Query
  const {
    data: statistics,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['sales-statistics', globalSelectedCompany, revenuePeriod],
    queryFn: () => salesApiService.getStatistics({
      companyId: globalSelectedCompany === 'all' ? 'all' : globalSelectedCompany,
      period: revenuePeriod
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const getPeriodLabel = (period: RevenuePeriod): string => {
    switch (period) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'thisMonth': return 'This Month';
      case 'lastMonth': return 'Last Month';
      case 'last6Months': return 'Last 6 Months';
      case 'thisYear': return 'This Year';
      case 'lastYear': return 'Last Year';
      default: return 'This Month';
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isLoading);

  // Handle loading state
  if (showLoader) {
    return <LoadingScreen />;
  }

  // Handle error state
  if (isError) {
    return (
      <div className="min-h-screen bg-lime-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Sales Data</h2>
          <p className="text-gray-600">{error?.message || 'Failed to load sales statistics'}</p>
        </div>
      </div>
    );
  }

  const stats = statistics?.summary || {
    totalRevenue: 0,
    activeClients: 0,
    activeProducts: 0,
    pendingInvoices: 0
  };

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-2 bg-blue-100 rounded-lg">
          <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Sales</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your sales operations including products, clients, and invoicing</p>
        </div>
      </div>

      {/* Stats Overview */}
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 sm:mb-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Total Revenue
                    </div>
                    <Select value={revenuePeriod} onValueChange={(value: RevenuePeriod) => setRevenuePeriod(value)}>
                      <SelectTrigger className="h-7 w-auto text-xs border-none bg-transparent p-1 focus:ring-0 focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                        <SelectItem value="lastMonth">Last Month</SelectItem>
                        <SelectItem value="last6Months">Last 6 Months</SelectItem>
                        <SelectItem value="thisYear">This Year</SelectItem>
                        <SelectItem value="lastYear">Last Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold break-all">{formatCurrency(stats.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">{getPeriodLabel(revenuePeriod)}</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total revenue generated from paid invoices in the selected period</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Active Clients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{stats.activeClients}</div>
                  <p className="text-xs text-muted-foreground">Registered clients</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Number of active clients in your database</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{stats.activeProducts}</div>
                  <p className="text-xs text-muted-foreground">Available products</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Number of active products and services in your catalog</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Pending Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{stats.pendingInvoices}</div>
                  <p className="text-xs text-muted-foreground">Awaiting payment</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Number of invoices sent but not yet paid</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Main Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/sales/products">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>Manage products and services</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Create and manage your product catalog for invoicing. 
                Each product includes pricing, descriptions, and cost tracking.
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Product catalog</span> managed
                </div>
                <Button variant="outline" size="sm">
                  Manage Products
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/sales/clients">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Clients</CardTitle>
                  <CardDescription>Manage client relationships</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Maintain comprehensive client profiles with contact information, 
                billing details, and interaction history for better relationship management.
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Client relationships</span> tracked
                </div>
                <Button variant="outline" size="sm">
                  Manage Clients
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/sales/invoices">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>Create and manage professional invoices</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Generate professional invoices with customizable templates, client management, 
                tax calculations, and automated follow-ups.
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Professional invoices</span> created
                </div>
                <Button variant="outline" size="sm">
                  Manage Invoices
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common sales tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/sales/products">
                <Button className="w-full" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </Link>
              <Link href="/sales/clients">
                <Button className="w-full" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              </Link>
              <Link href="/sales/invoices">
                <Button className="w-full" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
} 