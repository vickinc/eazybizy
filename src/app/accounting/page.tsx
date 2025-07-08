"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calculator, FileText, Plus, TrendingUp, DollarSign, Clock, Package } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

export default function AccountingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    pendingInvoices: 0,
    totalRevenue: 0,
    expenseEntries: 0
  });

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboardData = async () => {
      try {
        // Here you would load actual data from localStorage or API
        // For now, simulating a brief load time
        await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay, let delayed hook handle the rest
        
        // Load data from localStorage
        const invoices = JSON.parse(localStorage.getItem('app-invoices') || '[]');
        const entries = JSON.parse(localStorage.getItem('app-bookkeeping-entries') || '[]');
        
        setStats({
          totalInvoices: invoices.length,
          pendingInvoices: invoices.filter((inv: any) => inv.status === 'sent').length,
          totalRevenue: invoices.filter((inv: any) => inv.status === 'paid').reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0),
          expenseEntries: entries.filter((entry: any) => entry.type === 'EXPENSE').length
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isLoading);

  if (showLoader) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center space-x-3 mb-6 sm:mb-8">
        <div className="p-2 bg-green-100 rounded-lg">
          <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Accounting Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage invoices, track expenses, and maintain financial records</p>
        </div>
      </div>

      {/* Stats Overview */}
      <TooltipProvider>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Total Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{stats.totalInvoices}</div>
                  <p className="text-xs text-muted-foreground">Total invoices created</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total number of invoices created across all companies</p>
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
                  <p className="text-xs text-muted-foreground">Pending invoices</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total amount of unpaid invoices awaiting payment</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total revenue</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total revenue generated this month from paid invoices</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Expense Entries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{stats.expenseEntries}</div>
                  <p className="text-xs text-muted-foreground">Expense entries</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Number of invoices that are past their due date</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Main Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/accounting/banks-wallets">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Banks & Wallets</CardTitle>
                  <CardDescription>Manage payment methods</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Configure bank accounts and digital wallets for 
                receiving payments from clients.
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Payment methods</span> configured
                </div>
                <Button variant="outline" size="sm">
                  Manage Methods
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/accounting/currency-rates">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Currency Rates</CardTitle>
                  <CardDescription>Manage exchange rates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Set and update exchange rates for FIAT and crypto currencies 
                used in invoicing and reporting.
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Exchange rates</span> managed
                </div>
                <Button variant="outline" size="sm">
                  Manage Rates
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/accounting/bookkeeping">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Calculator className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <CardTitle>Bookkeeping</CardTitle>
                  <CardDescription>Track income and expenses</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Maintain your books with simple income and expense tracking, 
                automated categorization, and basic P&L reporting.
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">156 transactions</span> this month
                </div>
                <Button variant="outline" size="sm">
                  View Books
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/accounting/fixed-assets">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Fixed Assets</CardTitle>
                  <CardDescription>Asset register & depreciation</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Track fixed assets, calculate depreciation, and manage 
                disposal records for your business equipment and property.
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Asset register</span> managed
                </div>
                <Button variant="outline" size="sm">
                  Manage Assets
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
            <CardDescription>Common accounting tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/sales/invoices">
                <Button className="w-full" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </Link>
              <Button className="w-full" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Record Expense
              </Button>
              <Button className="w-full" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
} 