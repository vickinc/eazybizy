import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface VendorExport {
  id: string;
  companyName: string;
  contactPerson?: string;
  contactEmail: string;
  phone?: string;
  website?: string;
  paymentTerms: string | number;
  currency: string;
  paymentMethod: string;
  billingAddress?: string;
  isActive?: boolean;
  itemsServicesSold?: string;
  productCount?: number;
  relatedCompanyName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class VendorsExportService {
  /**
   * Export vendors to CSV format
   */
  static exportToCSV(vendors: VendorExport[], filename: string = 'vendors-export'): void {
    // Define CSV headers
    const headers = [
      'Company Name',
      'Contact Person',
      'Contact Email',
      'Phone',
      'Website',
      'Payment Terms (Days)',
      'Currency',
      'Payment Method',
      'Billing Address',
      'Items/Services Sold',
      'Product Count',
      'Status',
      'Related Company',
      'Created Date',
      'Last Updated'
    ];

    // Convert vendors to CSV rows
    const rows = vendors.map(vendor => [
      vendor.companyName,
      vendor.contactPerson || '',
      vendor.contactEmail,
      vendor.phone || '',
      vendor.website || '',
      vendor.paymentTerms.toString(),
      vendor.currency,
      vendor.paymentMethod,
      vendor.billingAddress || '',
      vendor.itemsServicesSold || '',
      vendor.productCount?.toString() || '0',
      vendor.isActive !== false ? 'Active' : 'Inactive',
      vendor.relatedCompanyName || '',
      vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : '',
      vendor.updatedAt ? new Date(vendor.updatedAt).toLocaleDateString() : ''
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
   * Export vendors to PDF format
   */
  static exportToPDF(
    vendors: VendorExport[], 
    companyName: string = 'All Companies',
    filters: { 
      searchTerm?: string; 
      statusFilter?: string;
    } = {},
    filename: string = 'vendors-export'
  ): void {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Vendors Report', 14, 20);
    
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
    
    // Calculate summary statistics
    const activeVendors = vendors.filter(v => v.isActive !== false);
    const totalVendors = vendors.length;
    const totalActiveVendors = activeVendors.length;
    const totalInactiveVendors = totalVendors - totalActiveVendors;
    
    // Calculate average payment terms
    const avgPaymentTerms = activeVendors.length > 0
      ? activeVendors.reduce((sum, v) => sum + (Number(v.paymentTerms) || 0), 0) / activeVendors.length
      : 0;
    
    // Group by currency
    const byCurrency = vendors.reduce((acc, vendor) => {
      if (vendor.isActive !== false) {
        acc[vendor.currency] = (acc[vendor.currency] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // Group by payment method
    const byPaymentMethod = vendors.reduce((acc, vendor) => {
      if (vendor.isActive !== false) {
        acc[vendor.paymentMethod] = (acc[vendor.paymentMethod] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // Add summary
    yPosition += 4;
    doc.setFontSize(12);
    doc.text('Summary:', 14, yPosition);
    yPosition += 6;
    doc.setFontSize(10);
    doc.text(`Total Vendors: ${totalVendors}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Active: ${totalActiveVendors} | Inactive: ${totalInactiveVendors}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Average Payment Terms: ${avgPaymentTerms.toFixed(0)} days`, 14, yPosition);
    yPosition += 6;
    
    // Add currency breakdown
    if (Object.keys(byCurrency).length > 0) {
      doc.text('By Currency: ' + Object.entries(byCurrency).map(([curr, count]) => `${curr} (${count})`).join(', '), 14, yPosition);
      yPosition += 6;
    }
    
    // Add payment method breakdown
    if (Object.keys(byPaymentMethod).length > 0) {
      doc.text('By Payment Method: ' + Object.entries(byPaymentMethod).map(([method, count]) => `${method} (${count})`).join(', '), 14, yPosition);
      yPosition += 6;
    }
    
    // Prepare table data
    const tableData = vendors.map(vendor => [
      vendor.companyName,
      vendor.contactPerson || '-',
      vendor.contactEmail,
      vendor.paymentTerms.toString() + ' days',
      vendor.currency,
      vendor.paymentMethod,
      vendor.isActive !== false ? 'Active' : 'Inactive'
    ]);
    
    // Add table
    autoTable(doc, {
      head: [['Company', 'Contact', 'Email', 'Payment Terms', 'Currency', 'Payment Method', 'Status']],
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
        0: { cellWidth: 28 }, // Company
        1: { cellWidth: 24 }, // Contact
        2: { cellWidth: 38 }, // Email
        3: { cellWidth: 18, halign: 'center' as const }, // Payment Terms
        4: { cellWidth: 18, halign: 'center' as const }, // Currency
        5: { cellWidth: 22, halign: 'center' as const }, // Payment Method
        6: { cellWidth: 17, halign: 'center' as const } // Status
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
}