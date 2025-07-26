import { BookkeepingEntry } from '@/types/bookkeeping.types';
import { formatDateForDisplay } from '@/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export class EntriesExportService {
  /**
   * Export entries to CSV format
   */
  static exportToCSV(entries: BookkeepingEntry[], filename: string = 'entries-export'): void {
    // Define CSV headers
    const headers = [
      'Date',
      'Type',
      'Category',
      'Subcategory',
      'Description',
      'Amount',
      'Currency',
      'COGS',
      'COGS Paid',
      'Reference',
      'Vendor Invoice',
      'Account Type',
      'Company ID',
      'Created At'
    ];

    // Convert entries to CSV rows
    const rows = entries.map(entry => [
      formatDateForDisplay(entry.date),
      entry.type,
      entry.category,
      entry.subcategory || '',
      entry.description,
      entry.amount.toString(),
      entry.currency,
      entry.cogs?.toString() || '',
      entry.cogsPaid?.toString() || '',
      entry.reference || '',
      entry.vendorInvoice || '',
      entry.accountType || '',
      entry.companyId.toString(),
      formatDateForDisplay(entry.createdAt)
    ]);

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
   * Export entries to PDF format
   */
  static exportToPDF(
    entries: BookkeepingEntry[], 
    companyName: string = 'All Companies',
    filters: { dateFrom?: string; dateTo?: string; type?: string } = {},
    filename: string = 'entries-export'
  ): void {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Revenue & Expense Entries Report', 14, 20);
    
    // Add company and date range info
    doc.setFontSize(10);
    doc.text(`Company: ${companyName}`, 14, 30);
    
    let dateRangeText = 'Date Range: ';
    if (filters.dateFrom && filters.dateTo) {
      dateRangeText += `${formatDateForDisplay(filters.dateFrom)} - ${formatDateForDisplay(filters.dateTo)}`;
    } else if (filters.dateFrom) {
      dateRangeText += `From ${formatDateForDisplay(filters.dateFrom)}`;
    } else if (filters.dateTo) {
      dateRangeText += `To ${formatDateForDisplay(filters.dateTo)}`;
    } else {
      dateRangeText += 'All Time';
    }
    doc.text(dateRangeText, 14, 36);
    
    if (filters.type) {
      doc.text(`Type: ${filters.type === 'revenue' ? 'Revenue Only' : 'Expenses Only'}`, 14, 42);
    }
    
    // Calculate summary
    const summary = entries.reduce((acc, entry) => {
      if (entry.type === 'revenue') {
        acc.totalRevenue += entry.amount;
        acc.totalCogs += entry.cogs || 0;
      } else {
        acc.totalExpenses += entry.amount;
      }
      return acc;
    }, { totalRevenue: 0, totalExpenses: 0, totalCogs: 0 });
    
    // Add summary
    doc.setFontSize(12);
    doc.text('Summary:', 14, 52);
    doc.setFontSize(10);
    doc.text(`Total Revenue: ${this.formatCurrency(summary.totalRevenue)}`, 14, 58);
    doc.text(`Total Expenses: ${this.formatCurrency(summary.totalExpenses)}`, 14, 64);
    doc.text(`Total COGS: ${this.formatCurrency(summary.totalCogs)}`, 14, 70);
    doc.text(`Net Profit: ${this.formatCurrency(summary.totalRevenue - summary.totalExpenses)}`, 14, 76);
    
    // Prepare table data
    const tableData = entries.map(entry => [
      formatDateForDisplay(entry.date),
      entry.type === 'revenue' ? 'Revenue' : 'Expense',
      entry.category,
      entry.description,
      this.formatCurrency(entry.amount, entry.currency),
      entry.cogs ? this.formatCurrency(entry.cogs, entry.currency) : '',
      entry.reference || ''
    ]);
    
    // Add table
    autoTable(doc, {
      head: [['Date', 'Type', 'Category', 'Description', 'Amount', 'COGS', 'Reference']],
      body: tableData,
      startY: 85,
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
        0: { cellWidth: 25 }, // Date
        1: { cellWidth: 20 }, // Type
        2: { cellWidth: 30 }, // Category
        3: { cellWidth: 'auto' }, // Description
        4: { cellWidth: 25, halign: 'right' as const }, // Amount
        5: { cellWidth: 25, halign: 'right' as const }, // COGS
        6: { cellWidth: 25 } // Reference
      }
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