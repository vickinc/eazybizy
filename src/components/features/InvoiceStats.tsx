import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Send from "lucide-react/dist/esm/icons/send";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import { InvoiceStatistics } from "@/services/database/invoiceSSRService";

interface InvoiceStatsProps {
  statistics: InvoiceStatistics | null;
}

export const InvoiceStats: React.FC<InvoiceStatsProps> = ({ statistics }) => {
  // Handle both SSR and API response structures
  // SSR structure has summary.totalInvoices, statusBreakdown.sent.count, etc.
  // API structure also has summary.totalInvoices, statusBreakdown.sent.count, etc.
  
  const totalInvoices = statistics?.summary?.totalInvoices || 0;
  
  // The API uses lowercase keys in statusBreakdown
  const sentInvoices = statistics?.statusBreakdown?.sent?.count || 0;
  
  // For paid invoices, check both paymentAnalysis and statusBreakdown
  const paidInvoices = statistics?.paymentAnalysis?.paidInvoicesCount || 
                       statistics?.statusBreakdown?.paid?.count || 0;
  
  const totalValue = statistics?.summary?.totalValue || 0;

  // Format the total value as currency
  const totalValueFormatted = totalValue.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Total Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Send className="h-4 w-4 mr-2" />
              Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{sentInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{paidInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalValueFormatted}</div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};