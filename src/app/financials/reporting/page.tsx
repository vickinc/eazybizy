"use client";

import React from "react";
import Link from "next/link";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Building from "lucide-react/dist/esm/icons/building";
import Banknote from "lucide-react/dist/esm/icons/banknote";
import Scale from "lucide-react/dist/esm/icons/scale";
import FileText from "lucide-react/dist/esm/icons/file-text";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

export default function FinancialReportingPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading reporting data
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

const financialStatements = [
  {
    title: "Profit & Loss Statement",
    description: "Income statement showing revenues, expenses, and net profit over a specific period. Essential for understanding business profitability and operational performance.",
    href: "/financials/reporting/profit-loss",
    icon: TrendingUp,
    color: "bg-green-100 text-green-600",
    features: [
      "Revenue and expense tracking",
      "Gross and net profit margins",
      "Operating income analysis",
      "Period-over-period comparisons"
    ]
  },
  {
    title: "Balance Sheet",
    description: "Snapshot of financial position showing assets, liabilities, and equity at a specific point in time. Provides insight into financial stability and capital structure.",
    href: "/financials/reporting/balance-sheet",
    icon: Building,
    color: "bg-blue-100 text-blue-600",
    features: [
      "Assets and liabilities overview",
      "Equity and retained earnings",
      "Working capital analysis",
      "Financial ratio calculations"
    ]
  },
  {
    title: "Cash Flow Statement",
    description: "Tracks cash movements from operating, investing, and financing activities. Critical for understanding liquidity and cash management.",
    href: "/financials/reporting/cash-flow-stmt",
    icon: Banknote,
    color: "bg-purple-100 text-purple-600",
    features: [
      "Operating cash flow analysis",
      "Investment activity tracking",
      "Financing cash flows",
      "Net cash position changes"
    ]
  },
  {
    title: "Statement of Equity Changes",
    description: "Shows changes in shareholders' equity over a period, including retained earnings, share capital movements, and other comprehensive income.",
    href: "/financials/reporting/equity-changes",
    icon: Scale,
    color: "bg-orange-100 text-orange-600",
    features: [
      "Share capital movements",
      "Retained earnings changes",
      "Dividend distributions",
      "Other comprehensive income"
    ]
  }
];

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              Financial Reporting
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Generate and analyze comprehensive financial statements for informed decision making
            </p>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About Financial Statements</CardTitle>
            <CardDescription>
              Financial statements provide a comprehensive view of your business's financial health and performance. 
              These standardized reports help stakeholders understand profitability, financial position, cash flows, 
              and changes in equity over time.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Financial Statements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {financialStatements.map((statement) => {
          const IconComponent = statement.icon;
          
          return (
            <Card key={statement.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${statement.color}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{statement.title}</CardTitle>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  {statement.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Key Features */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Key Features:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {statement.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Action Button */}
                  <div className="pt-2">
                    <Button asChild className="w-full">
                      <Link href={statement.href} className="flex items-center justify-center">
                        View Statement
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Information */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report Generation</CardTitle>
            <CardDescription>
              All financial statements can be generated for custom date ranges and include options for 
              exporting to PDF, Excel, or CSV formats. Historical comparisons and trend analysis are 
              available for most reports.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
      </div>
    </div>
  );
}