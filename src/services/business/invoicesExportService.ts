import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceExport {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  subtotal: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'archived';
  dueDate: string;
  issueDate: string;
  paidDate?: string;
  createdAt?: string;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  fromCompanyId: number;
  paymentMethodIds: string[];
  notes?: string;
  companyName?: string;
  items?: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  daysOverdue?: number;
  isOverdue?: boolean;
  paymentMethodNames?: string[];
}

export class InvoicesExportService {
  /**
   * Export invoices to CSV format
   */
  static exportToCSV(invoices: InvoiceExport[], filename: string = 'invoices-export'): void {
    // Define CSV headers
    const headers = [
      'Invoice Number',
      'Client Name',
      'Client Email',
      'Status',
      'Issue Date',
      'Due Date',
      'Paid Date',
      'Subtotal',
      'Tax Rate (%)',
      'Tax Amount',
      'Total Amount',
      'Currency',
      'Days Overdue',
      'Company',
      'Payment Methods',
      'Items Count',
      'Notes',
      'Created Date'
    ];

    // Convert invoices to CSV rows
    const rows = invoices.map(invoice => {
      const itemsCount = invoice.items ? invoice.items.length : 0;
      const paymentMethods = invoice.paymentMethodNames ? invoice.paymentMethodNames.join('; ') : '';
      
      return [
        invoice.invoiceNumber,
        invoice.clientName,
        invoice.clientEmail,
        invoice.status.toUpperCase(),
        new Date(invoice.issueDate).toLocaleDateString(),
        new Date(invoice.dueDate).toLocaleDateString(),
        invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : '',
        invoice.subtotal.toFixed(2),
        invoice.taxRate.toFixed(1),
        invoice.taxAmount.toFixed(2),
        invoice.totalAmount.toFixed(2),
        invoice.currency,
        invoice.daysOverdue?.toString() || '0',
        invoice.companyName || '',
        paymentMethods,
        itemsCount.toString(),
        invoice.notes || '',
        invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : ''
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          // Handle null/undefined values
          const cellStr = cell || '';
          // Escape quotes and wrap in quotes if contains comma, newline, or quotes
          const escaped = cellStr.replace(/"/g, '""');
          return /[,\n"]/.test(cellStr) ? `"${escaped}"` : escaped;
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /**
   * Export invoices to PDF format
   */
  static exportToPDF(
    invoices: InvoiceExport[], 
    companyName: string = 'All Companies',
    filters: { 
      searchTerm?: string; 
      statusFilter?: string;
      clientFilter?: string;
      dateRangeFilter?: string;
      currencyFilter?: string;
    } = {},
    filename: string = 'invoices-export'
  ): void {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Invoices Report', 14, 20);
    
    // Add company info
    doc.setFontSize(10);
    doc.text(`Company: ${companyName}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36);
    
    // Add filter info if any filters are applied
    let yPosition = 42;
    if (filters.searchTerm) {
      doc.text(`Search: ${filters.searchTerm}`, 14, yPosition);
      yPosition += 6;
    }
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      doc.text(`Status: ${filters.statusFilter.toUpperCase()}`, 14, yPosition);
      yPosition += 6;
    }
    if (filters.clientFilter) {
      doc.text(`Client: ${filters.clientFilter}`, 14, yPosition);
      yPosition += 6;
    }
    if (filters.dateRangeFilter && filters.dateRangeFilter !== 'all') {
      doc.text(`Date Range: ${filters.dateRangeFilter}`, 14, yPosition);
      yPosition += 6;
    }
    if (filters.currencyFilter) {
      doc.text(`Currency: ${filters.currencyFilter}`, 14, yPosition);
      yPosition += 6;
    }
    
    // Calculate summary statistics (case-insensitive status matching)
    const totalInvoices = invoices.length;
    const draftInvoices = invoices.filter(i => i.status.toLowerCase() === 'draft').length;
    const sentInvoices = invoices.filter(i => i.status.toLowerCase() === 'sent').length;
    const paidInvoices = invoices.filter(i => i.status.toLowerCase() === 'paid').length;
    const overdueInvoices = invoices.filter(i => i.status.toLowerCase() === 'overdue').length;
    const archivedInvoices = invoices.filter(i => i.status.toLowerCase() === 'archived').length;
    
    // Group by currency for total values
    const valueByCurrency = invoices.reduce((acc, invoice) => {
      const currency = invoice.currency;
      if (!acc[currency]) {
        acc[currency] = { 
          total: 0, 
          paid: 0, 
          outstanding: 0,
          count: 0 
        };
      }
      acc[currency].total += invoice.totalAmount;
      acc[currency].count += 1;
      if (invoice.status.toLowerCase() === 'paid') {
        acc[currency].paid += invoice.totalAmount;
      } else if (invoice.status.toLowerCase() !== 'draft' && invoice.status.toLowerCase() !== 'archived') {
        acc[currency].outstanding += invoice.totalAmount;
      }
      return acc;
    }, {} as Record<string, { total: number; paid: number; outstanding: number; count: number }>);
    
    // Group by status (normalize case for consistency)
    const byStatus = invoices.reduce((acc, invoice) => {
      const normalizedStatus = invoice.status.toLowerCase();
      acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Add summary
    yPosition += 4;
    doc.setFontSize(12);
    doc.text('Summary:', 14, yPosition);
    yPosition += 6;
    doc.setFontSize(10);
    doc.text(`Total Invoices: ${totalInvoices}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Draft: ${draftInvoices} | Sent: ${sentInvoices} | Paid: ${paidInvoices} | Overdue: ${overdueInvoices} | Archived: ${archivedInvoices}`, 14, yPosition);
    yPosition += 6;
    
    // Add value by currency
    Object.entries(valueByCurrency).forEach(([currency, data]) => {
      doc.text(
        `${currency}: ${data.count} invoices | Total: ${this.formatCurrency(data.total, currency)} | Paid: ${this.formatCurrency(data.paid, currency)} | Outstanding: ${this.formatCurrency(data.outstanding, currency)}`, 
        14, 
        yPosition
      );
      yPosition += 6;
    });
    
    // Add status breakdown
    if (Object.keys(byStatus).length > 0) {
      const statusLabels = {
        'draft': 'DRAFT',
        'sent': 'SENT', 
        'paid': 'PAID',
        'overdue': 'OVERDUE',
        'archived': 'ARCHIVED'
      };
      doc.text('By Status: ' + Object.entries(byStatus).map(([status, count]) => `${statusLabels[status as keyof typeof statusLabels] || status.toUpperCase()} (${count})`).join(', '), 14, yPosition);
      yPosition += 6;
    }
    
    // Prepare table data
    const tableData = invoices.map(invoice => [
      invoice.invoiceNumber,
      invoice.clientName,
      invoice.status.toUpperCase(),
      new Date(invoice.issueDate).toLocaleDateString(),
      new Date(invoice.dueDate).toLocaleDateString(),
      this.formatCurrency(invoice.totalAmount, invoice.currency),
      invoice.daysOverdue && invoice.daysOverdue > 0 ? `${invoice.daysOverdue}d` : '-'
    ]);
    
    // Add table
    autoTable(doc, {
      head: [['Invoice #', 'Client', 'Status', 'Issue Date', 'Due Date', 'Amount', 'Overdue']],
      body: tableData,
      startY: yPosition + 4,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [34, 197, 94], // Green color matching the app theme
        textColor: 255
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244] // Light green
      },
      columnStyles: {
        0: { cellWidth: 32 }, // Invoice # - increased to fit full number
        1: { cellWidth: 30 }, // Client - slightly reduced
        2: { cellWidth: 18, halign: 'center' as const }, // Status - reduced
        3: { cellWidth: 23, halign: 'center' as const }, // Issue Date - reduced
        4: { cellWidth: 23, halign: 'center' as const }, // Due Date - reduced
        5: { cellWidth: 25, halign: 'right' as const }, // Amount
        6: { cellWidth: 16, halign: 'center' as const } // Overdue - reduced
      },
      // Ensure table doesn't overflow
      tableWidth: 'auto',
      margin: { left: 14, right: 14 }
    });
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleDateString()}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  /**
   * Format currency for display
   */
  private static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}