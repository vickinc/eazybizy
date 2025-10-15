import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { PLData } from '@/services/business/profitLossBusinessService';

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
  },
  header: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
  },
  subHeader: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666666',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#333333',
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    paddingLeft: 15,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    marginTop: 5,
    borderTop: 1,
    borderColor: '#cccccc',
    fontFamily: 'Helvetica-Bold',
  },
  grandTotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    marginTop: 10,
    borderTop: 2,
    borderBottom: 2,
    borderColor: '#333333',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },
  leftText: {
    flex: 1,
    textAlign: 'left',
  },
  rightText: {
    width: 80,
    textAlign: 'right',
  },
  marginText: {
    fontSize: 8,
    color: '#666666',
    marginLeft: 10,
  },
  positiveAmount: {
    color: '#047857',
  },
  negativeAmount: {
    color: '#dc2626',
  },
});

// PDF Document Component
export const PLPDFDocument = ({ plData, companyName, periodName, formatCurrency }: {
  plData: PLData;
  companyName: string;
  periodName: string;
  formatCurrency: (amount: number) => string;
}) => {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
      <Text style={pdfStyles.header}>Profit & Loss Statement</Text>
      <Text style={pdfStyles.subHeader}>{companyName} • {periodName}</Text>
      
      {/* Revenue */}
      <Text style={pdfStyles.sectionTitle}>REVENUE</Text>
      {plData.revenue.items.map((item, index) => (
        <View key={index} style={pdfStyles.lineItem}>
          <Text style={pdfStyles.leftText}>{item.category}</Text>
          <Text style={[pdfStyles.rightText, pdfStyles.positiveAmount]}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
      ))}
      <View style={pdfStyles.totalLine}>
        <Text style={pdfStyles.leftText}>Total Revenue</Text>
        <Text style={[pdfStyles.rightText, pdfStyles.positiveAmount]}>
          {formatCurrency(plData.revenue.total)}
        </Text>
      </View>

      {/* COGS */}
      {plData.cogs.total > 0 && (
        <>
          <Text style={pdfStyles.sectionTitle}>COST OF GOODS SOLD</Text>
          {plData.cogs.items.map((item, index) => (
            <View key={index} style={pdfStyles.lineItem}>
              <Text style={pdfStyles.leftText}>{item.category}</Text>
              <Text style={[pdfStyles.rightText, pdfStyles.negativeAmount]}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}
          <View style={pdfStyles.totalLine}>
            <Text style={pdfStyles.leftText}>Total COGS</Text>
            <Text style={[pdfStyles.rightText, pdfStyles.negativeAmount]}>
              {formatCurrency(plData.cogs.total)}
            </Text>
          </View>
        </>
      )}

      {/* Gross Profit */}
      <View style={pdfStyles.grandTotalLine}>
        <Text style={pdfStyles.leftText}>GROSS PROFIT</Text>
        <Text style={[pdfStyles.rightText, plData.grossProfit >= 0 ? pdfStyles.positiveAmount : pdfStyles.negativeAmount]}>
          {formatCurrency(plData.grossProfit)}
        </Text>
      </View>
      <Text style={pdfStyles.marginText}>Margin: {plData.grossProfitMargin.toFixed(1)}%</Text>

      {/* Operating Expenses */}
      <Text style={pdfStyles.sectionTitle}>OPERATING EXPENSES</Text>
      {plData.operatingExpenses.items.map((item, index) => (
        <View key={index} style={pdfStyles.lineItem}>
          <Text style={pdfStyles.leftText}>{item.category}</Text>
          <Text style={[pdfStyles.rightText, pdfStyles.negativeAmount]}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
      ))}
      <View style={pdfStyles.totalLine}>
        <Text style={pdfStyles.leftText}>Total Operating Expenses</Text>
        <Text style={[pdfStyles.rightText, pdfStyles.negativeAmount]}>
          {formatCurrency(plData.operatingExpenses.total)}
        </Text>
      </View>

      {/* Operating Income */}
      <View style={pdfStyles.grandTotalLine}>
        <Text style={pdfStyles.leftText}>OPERATING INCOME</Text>
        <Text style={[pdfStyles.rightText, plData.operatingIncome >= 0 ? pdfStyles.positiveAmount : pdfStyles.negativeAmount]}>
          {formatCurrency(plData.operatingIncome)}
        </Text>
      </View>
      <Text style={pdfStyles.marginText}>Margin: {plData.operatingMargin.toFixed(1)}%</Text>

      {/* Other Income/Expenses */}
      {(plData.otherIncome.total > 0 || plData.otherExpenses.total > 0) && (
        <>
          {plData.otherIncome.total > 0 && (
            <>
              <Text style={pdfStyles.sectionTitle}>OTHER INCOME</Text>
              {plData.otherIncome.items.map((item, index) => (
                <View key={index} style={pdfStyles.lineItem}>
                  <Text style={pdfStyles.leftText}>{item.category}</Text>
                  <Text style={[pdfStyles.rightText, pdfStyles.positiveAmount]}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              ))}
            </>
          )}

          {plData.otherExpenses.total > 0 && (
            <>
              <Text style={pdfStyles.sectionTitle}>OTHER EXPENSES</Text>
              {plData.otherExpenses.items.map((item, index) => (
                <View key={index} style={pdfStyles.lineItem}>
                  <Text style={pdfStyles.leftText}>{item.category}</Text>
                  <Text style={[pdfStyles.rightText, pdfStyles.negativeAmount]}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </>
      )}

      {/* Net Income */}
      <View style={[pdfStyles.grandTotalLine, { marginTop: 20, fontSize: 14 }]}>
        <Text style={pdfStyles.leftText}>NET INCOME</Text>
        <Text style={[pdfStyles.rightText, plData.netIncome >= 0 ? pdfStyles.positiveAmount : pdfStyles.negativeAmount]}>
          {formatCurrency(plData.netIncome)}
        </Text>
      </View>
        <Text style={pdfStyles.marginText}>Net Margin: {plData.netProfitMargin.toFixed(1)}%</Text>
      </Page>
    </Document>
  );
};

export interface ExportOptions {
  plData: PLData;
  companyName: string;
  periodName: string;
  formatCurrency: (amount: number) => string;
}

export class ProfitLossExportService {
  
  static async exportToPDF(options: ExportOptions): Promise<void> {
    try {
      const { plData, companyName, periodName, formatCurrency } = options;
      
      const doc = <PLPDFDocument plData={plData} companyName={companyName} periodName={periodName} formatCurrency={formatCurrency} />;
      
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `profit-loss-${companyName.replace(/[^a-zA-Z0-9]/g, '-')}-${periodName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('PDF export error:', error);
      throw new Error('Failed to export PDF');
    }
  }

  static async exportToExcel(options: ExportOptions): Promise<void> {
    try {
      const { plData, companyName, periodName } = options;
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      
      // Prepare data for Excel
      const data = [];
      
      // Header
      data.push(['Profit & Loss Statement']);
      data.push([`${companyName} • ${periodName}`]);
      data.push([]);
      
      // Revenue section
      data.push(['REVENUE']);
      plData.revenue.items.forEach(item => {
        data.push([`  ${item.category}`, item.amount]);
      });
      data.push(['Total Revenue', plData.revenue.total]);
      data.push([]);
      
      // COGS section
      if (plData.cogs.total > 0) {
        data.push(['COST OF GOODS SOLD']);
        plData.cogs.items.forEach(item => {
          data.push([`  ${item.category}`, item.amount]);
        });
        data.push(['Total COGS', plData.cogs.total]);
        data.push([]);
      }
      
      // Gross Profit
      data.push(['GROSS PROFIT', plData.grossProfit]);
      data.push([`Gross Margin: ${plData.grossProfitMargin.toFixed(1)}%`]);
      data.push([]);
      
      // Operating Expenses
      data.push(['OPERATING EXPENSES']);
      plData.operatingExpenses.items.forEach(item => {
        data.push([`  ${item.category}`, item.amount]);
      });
      data.push(['Total Operating Expenses', plData.operatingExpenses.total]);
      data.push([]);
      
      // Operating Income
      data.push(['OPERATING INCOME', plData.operatingIncome]);
      data.push([`Operating Margin: ${plData.operatingMargin.toFixed(1)}%`]);
      data.push([]);
      
      // Other Income/Expenses
      if (plData.otherIncome.total > 0) {
        data.push(['OTHER INCOME']);
        plData.otherIncome.items.forEach(item => {
          data.push([`  ${item.category}`, item.amount]);
        });
        data.push(['Total Other Income', plData.otherIncome.total]);
        data.push([]);
      }
      
      if (plData.otherExpenses.total > 0) {
        data.push(['OTHER EXPENSES']);
        plData.otherExpenses.items.forEach(item => {
          data.push([`  ${item.category}`, item.amount]);
        });
        data.push(['Total Other Expenses', plData.otherExpenses.total]);
        data.push([]);
      }
      
      // Net Income
      data.push(['NET INCOME', plData.netIncome]);
      data.push([`Net Margin: ${plData.netProfitMargin.toFixed(1)}%`]);
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Set column widths
      ws['!cols'] = [
        { width: 30 }, // Description column
        { width: 15 }  // Amount column
      ];
      
      // Add some basic formatting (bold headers)
      const range = XLSX.utils.decode_range(ws['!ref'] || '');
      for (const row = range.s.r; row <= range.e.r; row++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: 0 });
        if (ws[cellRef] && (
          ws[cellRef].v === 'REVENUE' ||
          ws[cellRef].v === 'COST OF GOODS SOLD' ||
          ws[cellRef].v === 'GROSS PROFIT' ||
          ws[cellRef].v === 'OPERATING EXPENSES' ||
          ws[cellRef].v === 'OPERATING INCOME' ||
          ws[cellRef].v === 'OTHER INCOME' ||
          ws[cellRef].v === 'OTHER EXPENSES' ||
          ws[cellRef].v === 'NET INCOME' ||
          ws[cellRef].v === 'Profit & Loss Statement'
        )) {
          ws[cellRef].s = { font: { bold: true } };
        }
      }
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Profit & Loss');
      
      // Generate Excel file and download
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const fileName = `profit-loss-${companyName.replace(/[^a-zA-Z0-9]/g, '-')}-${periodName.replace(/[^a-zA-Z0-9]/g, '-')}.xlsx`;
      saveAs(blob, fileName);
      
    } catch (error) {
      console.error('Excel export error:', error);
      throw new Error('Failed to export Excel file');
    }
  }

  static async exportToJSON(options: ExportOptions): Promise<void> {
    try {
      const { plData, companyName, periodName } = options;
      
      const exportData = {
        company: companyName,
        period: periodName,
        generatedAt: new Date().toISOString(),
        data: plData,
        metadata: {
          exportType: 'profit-loss',
          version: '1.0',
          currency: 'USD' // Could be parameterized if needed
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `profit-loss-${companyName.replace(/[^a-zA-Z0-9]/g, '-')}-${periodName.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('JSON export error:', error);
      throw new Error('Failed to export JSON file');
    }
  }

  static async exportToCSV(options: ExportOptions): Promise<void> {
    try {
      const { plData, companyName, periodName } = options;
      
      // Prepare CSV data
      const csvData = [];
      
      // Header
      csvData.push(['Profit & Loss Statement']);
      csvData.push([`${companyName} • ${periodName}`]);
      csvData.push([]);
      csvData.push(['Section', 'Category', 'Amount']);
      
      // Revenue
      csvData.push(['REVENUE', '', '']);
      plData.revenue.items.forEach(item => {
        csvData.push(['', item.category, item.amount]);
      });
      csvData.push(['', 'Total Revenue', plData.revenue.total]);
      csvData.push([]);
      
      // COGS
      if (plData.cogs.total > 0) {
        csvData.push(['COST OF GOODS SOLD', '', '']);
        plData.cogs.items.forEach(item => {
          csvData.push(['', item.category, item.amount]);
        });
        csvData.push(['', 'Total COGS', plData.cogs.total]);
        csvData.push([]);
      }
      
      // Gross Profit
      csvData.push(['GROSS PROFIT', '', plData.grossProfit]);
      csvData.push(['', `Gross Margin: ${plData.grossProfitMargin.toFixed(1)}%`, '']);
      csvData.push([]);
      
      // Operating Expenses
      csvData.push(['OPERATING EXPENSES', '', '']);
      plData.operatingExpenses.items.forEach(item => {
        csvData.push(['', item.category, item.amount]);
      });
      csvData.push(['', 'Total Operating Expenses', plData.operatingExpenses.total]);
      csvData.push([]);
      
      // Operating Income
      csvData.push(['OPERATING INCOME', '', plData.operatingIncome]);
      csvData.push(['', `Operating Margin: ${plData.operatingMargin.toFixed(1)}%`, '']);
      csvData.push([]);
      
      // Other Income/Expenses
      if (plData.otherIncome.total > 0) {
        csvData.push(['OTHER INCOME', '', '']);
        plData.otherIncome.items.forEach(item => {
          csvData.push(['', item.category, item.amount]);
        });
        csvData.push(['', 'Total Other Income', plData.otherIncome.total]);
        csvData.push([]);
      }
      
      if (plData.otherExpenses.total > 0) {
        csvData.push(['OTHER EXPENSES', '', '']);
        plData.otherExpenses.items.forEach(item => {
          csvData.push(['', item.category, item.amount]);
        });
        csvData.push(['', 'Total Other Expenses', plData.otherExpenses.total]);
        csvData.push([]);
      }
      
      // Net Income
      csvData.push(['NET INCOME', '', plData.netIncome]);
      csvData.push(['', `Net Margin: ${plData.netProfitMargin.toFixed(1)}%`, '']);
      
      // Convert to CSV string
      const csvString = csvData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');
      
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const fileName = `profit-loss-${companyName.replace(/[^a-zA-Z0-9]/g, '-')}-${periodName.replace(/[^a-zA-Z0-9]/g, '-')}.csv`;
      saveAs(blob, fileName);
      
    } catch (error) {
      console.error('CSV export error:', error);
      throw new Error('Failed to export CSV file');
    }
  }

  static validateExportOptions(options: ExportOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!options.plData) {
      errors.push('P&L data is required');
    }

    if (!options.companyName || options.companyName.trim() === '') {
      errors.push('Company name is required');
    }

    if (!options.periodName || options.periodName.trim() === '') {
      errors.push('Period name is required');
    }

    if (!options.formatCurrency || typeof options.formatCurrency !== 'function') {
      errors.push('Format currency function is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static getSupportedFormats(): Array<{ format: string; description: string; extension: string }> {
    return [
      { format: 'PDF', description: 'Portable Document Format - formatted for printing', extension: '.pdf' },
      { format: 'Excel', description: 'Microsoft Excel spreadsheet', extension: '.xlsx' },
      { format: 'JSON', description: 'JavaScript Object Notation - machine readable', extension: '.json' },
      { format: 'CSV', description: 'Comma Separated Values - simple spreadsheet format', extension: '.csv' }
    ];
  }

  static async exportMultipleFormats(options: ExportOptions, formats: string[]): Promise<void> {
    const validation = this.validateExportOptions(options);
    if (!validation.isValid) {
      throw new Error(`Export validation failed: ${validation.errors.join(', ')}`);
    }

    const exportPromises = formats.map(format => {
      switch (format.toLowerCase()) {
        case 'pdf':
          return this.exportToPDF(options);
        case 'excel':
        case 'xlsx':
          return this.exportToExcel(options);
        case 'json':
          return this.exportToJSON(options);
        case 'csv':
          return this.exportToCSV(options);
        default:
          return Promise.reject(new Error(`Unsupported format: ${format}`));
      }
    });

    try {
      await Promise.all(exportPromises);
    } catch (error) {
      console.error('Error exporting multiple formats:', error);
      throw new Error('Failed to export in one or more formats');
    }
  }
}