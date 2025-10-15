"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Calculator from "lucide-react/dist/esm/icons/calculator";
import FolderOpen from "lucide-react/dist/esm/icons/folder-open";
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import Receipt from "lucide-react/dist/esm/icons/receipt";
import Building from "lucide-react/dist/esm/icons/building";
import ChartLine from "lucide-react/dist/esm/icons/chart-line";
import Scale from "lucide-react/dist/esm/icons/scale";
import PieChart from "lucide-react/dist/esm/icons/pie-chart";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import ActivityIcon from "lucide-react/dist/esm/icons/activity";
import FileBarChart from "lucide-react/dist/esm/icons/file-bar-chart";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Link from "next/link";
import { useState, useEffect } from "react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

const financialStatements = [
  {
    title: "Profit & Loss Statement",
    description: "IFRS-compliant Statement of Profit or Loss with comprehensive income analysis",
    icon: FileBarChart,
    href: "/financials/profit-loss",
    color: "bg-emerald-500",
    features: ["IFRS compliance", "Comparative analysis", "Margin calculations", "Export to PDF/Excel", "Multi-period reporting"],
    isNew: false
  },
  {
    title: "Balance Sheet",
    description: "IFRS-compliant Statement of Financial Position showing assets, liabilities and equity",
    icon: Building2,
    href: "/financials/balance-sheet",
    color: "bg-blue-500",
    features: ["Current/non-current classification", "Balance validation", "Financial ratios", "Comparative figures", "IFRS guidance"],
    isNew: false
  },
  {
    title: "Cash Flow Statement",
    description: "IFRS-compliant Statement of Cash Flows with direct and indirect methods",
    icon: ActivityIcon,
    href: "/financials/cash-flow-stmt",
    color: "bg-purple-500",
    features: ["Direct & indirect methods", "Cash reconciliation", "Operating/investing/financing", "Working capital changes", "IAS 7 compliance"],
    isNew: false
  },
  {
    title: "Statement of Changes in Equity",
    description: "IFRS-compliant equity movements analysis showing changes in all equity components",
    icon: Scale,
    href: "/financials/equity-changes",
    color: "bg-indigo-500",
    features: ["Equity component tracking", "Comprehensive income attribution", "Dividend analysis", "Cross-statement validation", "IAS 1 compliance"],
    isNew: true
  }
];

const financialModules = [
  {
    title: "Invoices",
    description: "Create and manage professional invoices for any company",
    icon: FileText,
    href: "/financials/invoices",
    color: "bg-amber-500",
    features: ["Client management", "Tax calculations", "PDF download", "Status tracking", "Template selection"]
  },
  {
    title: "Simplified Accounting",
    description: "A straightforward system for tracking income and expenses",
    icon: Calculator,
    href: "/financials/accounting",
    color: "bg-green-500",
    features: ["Income & expense tracking", "Categorization", "P&L statements", "Expense breakdowns"]
  },
  {
    title: "Virtual Holding",
    description: "Group companies to view their combined financial performance",
    icon: FolderOpen,
    href: "/financials/holding",
    color: "bg-indigo-500",
    features: ["Company grouping", "Aggregated P&L", "Currency conversion", "Combined reporting"]
  },
  {
    title: "Company ARR Dashboard",
    description: "Track Annual Recurring Revenue and SaaS metrics",
    icon: BarChart3,
    href: "/financials/arr-dashboard",
    color: "bg-orange-500",
    features: ["ARR tracking", "MRR calculations", "Growth rates", "Churn analysis", "Trend charts"]
  },
  {
    title: "Company Valuation",
    description: "Estimate company valuation based on financial data",
    icon: TrendingUp,
    href: "/financials/valuation",
    color: "bg-red-500",
    features: ["Multiple methods", "Revenue multiples", "SDE calculations", "Valuation tracking"]
  },
  {
    title: "Integration Testing",
    description: "Comprehensive validation and IFRS compliance testing",
    icon: ShieldCheck,
    href: "/financials/integration-testing",
    color: "bg-purple-500",
    features: ["Cross-statement validation", "IFRS compliance checks", "Automated testing", "Error detection"]
  }
];

export default function FinancialsPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading financials data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100); // Reduced delay, let delayed hook handle the rest
    
    return () => clearTimeout(timer);
  }, []);

  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isLoading);

  if (showLoader) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <PieChart className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financials Dashboard</h1>
            <p className="text-gray-600">Comprehensive financial management and analysis tools</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Total Companies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total number of companies in your financial portfolio</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Receipt className="h-4 w-4 mr-2" />
                    Open Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Number of unpaid invoices across all companies</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <ChartLine className="h-4 w-4 mr-2" />
                    Total ARR
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$2.4M</div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Annual Recurring Revenue across all portfolio companies</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Scale className="h-4 w-4 mr-2" />
                    Portfolio Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$15.2M</div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total estimated value of all companies in your portfolio</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* IFRS Financial Statements Section */}
      <div className="mb-10">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">IFRS-Compliant Financial Statements</h2>
          <p className="text-gray-600">Generate professional financial statements that comply with International Financial Reporting Standards</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {financialStatements.map((statement) => {
            const IconComponent = statement.icon;
            
            return (
              <Card key={statement.title} className="hover:shadow-lg transition-shadow duration-200 relative">
                {statement.isNew && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    NEW
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 ${statement.color} rounded-lg`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{statement.title}</CardTitle>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="mt-2">
                    {statement.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Key Features:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {statement.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Link href={statement.href}>
                      <Button className="w-full group" variant={statement.isNew ? "default" : "outline"}>
                        View Statement
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Financial Modules */}
      <div className="mb-10">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Financial Management Tools</h2>
          <p className="text-gray-600">Additional tools for managing your business finances and portfolio</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {financialModules.map((module) => {
            const IconComponent = module.icon;
            
            return (
              <Card key={module.title} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 ${module.color} rounded-lg`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{module.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {module.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Key Features:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {module.features.map((feature, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Link href={module.href}>
                      <Button className="w-full group">
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
} 