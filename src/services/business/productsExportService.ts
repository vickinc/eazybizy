import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProductExport {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  cost?: number;
  costCurrency?: string;
  isActive?: boolean;
  vendorName?: string;
  companyName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class ProductsExportService {
  /**
   * Export products to CSV format
   */
  static exportToCSV(products: ProductExport[], filename: string = 'products-export'): void {
    // Define CSV headers
    const headers = [
      'Name',
      'Description',
      'Price',
      'Currency',
      'Cost',
      'Cost Currency',
      'Margin',
      'Margin %',
      'Status',
      'Vendor',
      'Company',
      'Created Date',
      'Last Updated'
    ];

    // Convert products to CSV rows
    const rows = products.map(product => {
      const margin = product.cost ? product.price - product.cost : 0;
      const marginPercent = product.cost && product.cost > 0 
        ? ((product.price - product.cost) / product.cost * 100).toFixed(2) 
        : '0';
      
      return [
        product.name,
        product.description || '',
        product.price.toString(),
        product.currency,
        product.cost?.toString() || '',
        product.costCurrency || product.currency,
        margin.toString(),
        marginPercent,
        product.isActive !== false ? 'Active' : 'Inactive',
        product.vendorName || '',
        product.companyName || '',
        product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '',
        product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : ''
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
   * Export products to PDF format
   */
  static exportToPDF(
    products: ProductExport[], 
    companyName: string = 'All Companies',
    filters: { 
      searchTerm?: string; 
      statusFilter?: string; 
      currencyFilter?: string;
      vendorFilter?: string;
    } = {},
    filename: string = 'products-export'
  ): void {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Products & Services Report', 14, 20);
    
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
      doc.text(`Status: ${filters.statusFilter}`, 14, yPosition);
      yPosition += 6;
    }
    if (filters.currencyFilter && filters.currencyFilter !== 'all') {
      doc.text(`Currency: ${filters.currencyFilter}`, 14, yPosition);
      yPosition += 6;
    }
    if (filters.vendorFilter && filters.vendorFilter !== 'all') {
      doc.text(`Vendor: ${filters.vendorFilter}`, 14, yPosition);
      yPosition += 6;
    }
    
    // Calculate summary statistics
    const activeProducts = products.filter(p => p.isActive !== false);
    const totalProducts = products.length;
    const totalActiveProducts = activeProducts.length;
    const totalInactiveProducts = totalProducts - totalActiveProducts;
    
    // Group by currency for total value
    const valueByCurrency = products.reduce((acc, product) => {
      if (product.isActive !== false) {
        const currency = product.currency;
        if (!acc[currency]) {
          acc[currency] = { totalPrice: 0, totalCost: 0, count: 0 };
        }
        acc[currency].totalPrice += product.price;
        acc[currency].totalCost += product.cost || 0;
        acc[currency].count += 1;
      }
      return acc;
    }, {} as Record<string, { totalPrice: number; totalCost: number; count: number }>);
    
    // Add summary
    yPosition += 4;
    doc.setFontSize(12);
    doc.text('Summary:', 14, yPosition);
    yPosition += 6;
    doc.setFontSize(10);
    doc.text(`Total Products: ${totalProducts}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Active: ${totalActiveProducts} | Inactive: ${totalInactiveProducts}`, 14, yPosition);
    yPosition += 6;
    
    // Add value by currency
    Object.entries(valueByCurrency).forEach(([currency, data]) => {
      const avgMargin = data.totalPrice > 0 
        ? ((data.totalPrice - data.totalCost) / data.totalPrice * 100).toFixed(1) 
        : '0';
      doc.text(
        `${currency}: ${data.count} products | Avg Margin: ${avgMargin}%`, 
        14, 
        yPosition
      );
      yPosition += 6;
    });
    
    // Prepare table data
    const tableData = products.map(product => {
      // Ensure we have numbers for calculations
      const price = Number(product.price) || 0;
      const cost = Number(product.cost) || 0;
      
      // Calculate margin and margin percentage
      const margin = cost > 0 ? price - cost : 0;
      const marginPercent = cost > 0 
        ? ((margin / price) * 100).toFixed(1) + '%'  // Changed to margin/price for proper percentage
        : '-';
      
      return [
        product.name || '',
        (product.description || '').substring(0, 50) + (product.description && product.description.length > 50 ? '...' : ''),
        this.formatCurrency(price, product.currency),
        cost > 0 ? this.formatCurrency(cost, product.costCurrency || product.currency) : '-',
        marginPercent,
        product.isActive !== false ? 'Active' : 'Inactive'
      ];
    });
    
    // Add table
    autoTable(doc, {
      head: [['Name', 'Description', 'Price', 'Cost', 'Margin', 'Status']],
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
        0: { cellWidth: 35 }, // Name
        1: { cellWidth: 60 }, // Description
        2: { cellWidth: 25, halign: 'right' as const }, // Price
        3: { cellWidth: 25, halign: 'right' as const }, // Cost
        4: { cellWidth: 20, halign: 'right' as const }, // Margin
        5: { cellWidth: 20, halign: 'center' as const } // Status
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