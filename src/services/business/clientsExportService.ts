import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ClientExport {
  id: string;
  name: string;
  clientType: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  contactPersonName?: string;
  contactPersonPosition?: string;
  email: string;
  phone: string;
  website?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  industry: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LEAD' | 'ARCHIVED';
  notes?: string;
  totalInvoiced: number;
  totalPaid: number;
  registrationNumber?: string;
  vatNumber?: string;
  passportNumber?: string;
  dateOfBirth?: string;
  companyName?: string;
  createdAt?: string;
  lastInvoiceDate?: string;
  // Optional calculated fields from invoice data
  calculatedTotalInvoiced?: number;
  calculatedTotalPaid?: number;
  invoiceCount?: number;
}

export class ClientsExportService {
  /**
   * Export clients to CSV format
   */
  static exportToCSV(clients: ClientExport[], filename: string = 'clients-export'): void {
    // Define CSV headers
    const headers = [
      'Name',
      'Type',
      'Contact Person',
      'Position',
      'Email',
      'Phone',
      'Website',
      'Address',
      'City',
      'Zip Code',
      'Country',
      'Industry',
      'Status',
      'Total Invoiced',
      'Total Paid',
      'Outstanding',
      'Registration Number',
      'VAT Number',
      'Passport Number',
      'Date of Birth',
      'Company',
      'Notes',
      'Created Date',
      'Last Invoice Date'
    ];

    // Convert clients to CSV rows
    const rows = clients.map(client => {
      // Use calculated values if available, otherwise fall back to stored values
      const totalInvoiced = client.calculatedTotalInvoiced ?? client.totalInvoiced;
      const totalPaid = client.calculatedTotalPaid ?? client.totalPaid;
      const outstanding = totalInvoiced - totalPaid;
      
      return [
        client.name,
        client.clientType === 'LEGAL_ENTITY' ? 'Legal Entity' : 'Individual',
        client.contactPersonName || '',
        client.contactPersonPosition || '',
        client.email,
        client.phone || '',
        client.website || '',
        client.address || '',
        client.city || '',
        client.zipCode || '',
        client.country || '',
        client.industry,
        client.status,
        totalInvoiced.toFixed(2),
        totalPaid.toFixed(2),
        outstanding.toFixed(2),
        client.registrationNumber || '',
        client.vatNumber || '',
        client.passportNumber || '',
        client.dateOfBirth || '',
        client.companyName || '',
        client.notes || '',
        client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '',
        client.lastInvoiceDate ? new Date(client.lastInvoiceDate).toLocaleDateString() : ''
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
   * Export clients to PDF format
   */
  static exportToPDF(
    clients: ClientExport[], 
    companyName: string = 'All Companies',
    filters: { 
      searchTerm?: string; 
      statusFilter?: string;
      industryFilter?: string;
    } = {},
    filename: string = 'clients-export'
  ): void {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Clients Report', 14, 20);
    
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
    if (filters.industryFilter && filters.industryFilter !== 'all') {
      doc.text(`Industry: ${filters.industryFilter}`, 14, yPosition);
      yPosition += 6;
    }
    
    // Calculate summary statistics
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'ACTIVE').length;
    const leadClients = clients.filter(c => c.status === 'LEAD').length;
    const archivedClients = clients.filter(c => c.status === 'ARCHIVED').length;
    const inactiveClients = clients.filter(c => c.status === 'INACTIVE').length;
    
    const totalInvoiced = clients.reduce((sum, c) => sum + (c.calculatedTotalInvoiced ?? c.totalInvoiced), 0);
    const totalPaid = clients.reduce((sum, c) => sum + (c.calculatedTotalPaid ?? c.totalPaid), 0);
    const totalOutstanding = totalInvoiced - totalPaid;
    
    // Group by industry
    const byIndustry = clients.reduce((acc, client) => {
      acc[client.industry] = (acc[client.industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Group by client type
    const byType = clients.reduce((acc, client) => {
      const type = client.clientType === 'LEGAL_ENTITY' ? 'Legal Entity' : 'Individual';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Add summary
    yPosition += 4;
    doc.setFontSize(12);
    doc.text('Summary:', 14, yPosition);
    yPosition += 6;
    doc.setFontSize(10);
    doc.text(`Total Clients: ${totalClients}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Active: ${activeClients} | Leads: ${leadClients} | Inactive: ${inactiveClients} | Archived: ${archivedClients}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Total Invoiced: ${this.formatCurrency(totalInvoiced)}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Total Paid: ${this.formatCurrency(totalPaid)}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Outstanding: ${this.formatCurrency(totalOutstanding)}`, 14, yPosition);
    yPosition += 6;
    
    // Add industry breakdown
    if (Object.keys(byIndustry).length > 0) {
      doc.text('By Industry: ' + Object.entries(byIndustry).map(([industry, count]) => `${industry} (${count})`).join(', '), 14, yPosition);
      yPosition += 6;
    }
    
    // Add client type breakdown
    if (Object.keys(byType).length > 0) {
      doc.text('By Type: ' + Object.entries(byType).map(([type, count]) => `${type} (${count})`).join(', '), 14, yPosition);
      yPosition += 6;
    }
    
    // Prepare table data
    const tableData = clients.map(client => {
      // Use calculated values if available, otherwise fall back to stored values
      const totalInvoiced = client.calculatedTotalInvoiced ?? client.totalInvoiced;
      const totalPaid = client.calculatedTotalPaid ?? client.totalPaid;
      const outstanding = totalInvoiced - totalPaid;
      
      return [
        client.name,
        client.clientType === 'LEGAL_ENTITY' ? 'Legal' : 'Individual',
        client.email,
        client.industry,
        client.status,
        this.formatCurrency(totalInvoiced),
        this.formatCurrency(outstanding)
      ];
    });
    
    // Add table
    autoTable(doc, {
      head: [['Name', 'Type', 'Email', 'Industry', 'Status', 'Invoiced', 'Outstanding']],
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
        1: { cellWidth: 20, halign: 'center' as const }, // Type
        2: { cellWidth: 40 }, // Email
        3: { cellWidth: 25 }, // Industry
        4: { cellWidth: 18, halign: 'center' as const }, // Status
        5: { cellWidth: 22, halign: 'right' as const }, // Invoiced
        6: { cellWidth: 22, halign: 'right' as const } // Outstanding
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