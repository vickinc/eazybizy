import { Invoice } from '@/services/api/invoicesApiService.enhanced';

export class InvoicesBusinessService {
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    // List of crypto currencies that are not valid ISO 4217 currency codes
    const cryptoCurrencies = [
      'USDT', 'USDC', 'EURC', 'PYSD', 'USDG', 'USDS', 'SOL', 'BTC', 'ETH', 
      'SUI', 'HYPE', 'TRX', 'BNB', 'XRP', 'DOGE', 'ADA'
    ];
    
    if (cryptoCurrencies.includes(currency.toUpperCase())) {
      // For crypto currencies, use manual formatting
      const formattedAmount = amount.toFixed(8).replace(/\.?0+$/, ''); // Remove trailing zeros
      return `${formattedAmount} ${currency.toUpperCase()}`;
    }
    
    // For standard fiat currencies, use Intl.NumberFormat
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      // Fallback for invalid currency codes
      console.warn(`Invalid currency code: ${currency}, using manual formatting`);
      return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
    }
  }

  static filterInvoicesByPeriod(
    invoices: Invoice[], 
    period: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom',
    customDateRange?: { start: string; end: string }
  ): Invoice[] {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);
    const endOfThisYear = new Date(now.getFullYear(), 11, 31);
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);

    switch (period) {
      case 'thisMonth':
        return invoices.filter(invoice => {
          const invoiceDate = new Date(invoice.issueDate);
          return invoiceDate >= startOfThisMonth && invoiceDate <= endOfThisMonth;
        });
      case 'lastMonth':
        return invoices.filter(invoice => {
          const invoiceDate = new Date(invoice.issueDate);
          return invoiceDate >= startOfLastMonth && invoiceDate <= endOfLastMonth;
        });
      case 'thisYear':
        return invoices.filter(invoice => {
          const invoiceDate = new Date(invoice.issueDate);
          return invoiceDate >= startOfThisYear && invoiceDate <= endOfThisYear;
        });
      case 'lastYear':
        return invoices.filter(invoice => {
          const invoiceDate = new Date(invoice.issueDate);
          return invoiceDate >= startOfLastYear && invoiceDate <= endOfLastYear;
        });
      case 'custom':
        if (customDateRange && customDateRange.start && customDateRange.end) {
          const startDate = new Date(customDateRange.start);
          const endDate = new Date(customDateRange.end);
          return invoices.filter(invoice => {
            const invoiceDate = new Date(invoice.issueDate);
            return invoiceDate >= startDate && invoiceDate <= endDate;
          });
        }
        return invoices;
      case 'allTime':
      default:
        return invoices;
    }
  }

  static filterInvoicesByCompany(
    invoices: Invoice[], 
    companyId: number | 'all'
  ): Invoice[] {
    if (companyId === 'all') {
      return invoices;
    }
    
    // Check both companyId and fromCompanyId fields
    const filtered = invoices.filter(invoice => 
      invoice.companyId === companyId || 
      invoice.fromCompanyId === companyId ||
      Number(invoice.companyId) === Number(companyId) ||
      Number(invoice.fromCompanyId) === Number(companyId)
    );
    
    return filtered;
  }

  static filterInvoicesByStatus(
    invoices: Invoice[], 
    viewFilter: 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'archived'
  ): Invoice[] {
    // Don't filter by status in the business service when viewFilter is 'all'
    // Let the UI handle the active vs archived filtering
    if (viewFilter === 'all') {
      return invoices;
    }
    
    switch (viewFilter) {
      case 'draft':
        return invoices.filter(invoice => invoice.status === 'DRAFT');
      case 'sent':
        return invoices.filter(invoice => invoice.status === 'SENT');
      case 'paid':
        return invoices.filter(invoice => invoice.status === 'PAID');
      case 'overdue':
        return invoices.filter(invoice => invoice.status === 'OVERDUE');
      case 'archived':
        return invoices.filter(invoice => invoice.status === 'ARCHIVED');
      default:
        return invoices;
    }
  }

  static filterInvoicesByClient(
    invoices: Invoice[], 
    clientId: string
  ): Invoice[] {
    if (clientId === 'all') {
      return invoices;
    }
    return invoices.filter(invoice => invoice.clientId === clientId);
  }

  static filterInvoicesByCurrency(
    invoices: Invoice[], 
    currency: string
  ): Invoice[] {
    if (currency === 'all') {
      return invoices;
    }
    return invoices.filter(invoice => invoice.currency === currency);
  }

  static filterInvoicesBySearch(
    invoices: Invoice[], 
    searchTerm: string
  ): Invoice[] {
    if (!searchTerm) return invoices;
    
    const term = searchTerm.toLowerCase();
    return invoices.filter(invoice => 
      invoice.invoiceNumber?.toLowerCase().includes(term) ||
      invoice.clientName?.toLowerCase().includes(term) ||
      invoice.description?.toLowerCase().includes(term) ||
      invoice.notes?.toLowerCase().includes(term) ||
      invoice.poNumber?.toLowerCase().includes(term)
    );
  }

  static getFilteredInvoices(
    invoices: Invoice[],
    companyId: number | 'all',
    period: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom',
    customDateRange: { start: string; end: string },
    viewFilter: 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'archived',
    clientId: string,
    currency: string,
    searchTerm: string
  ): Invoice[] {
    let filtered = this.filterInvoicesByCompany(invoices, companyId);
    filtered = this.filterInvoicesByPeriod(filtered, period, customDateRange);
    filtered = this.filterInvoicesByStatus(filtered, viewFilter);
    filtered = this.filterInvoicesByClient(filtered, clientId);
    filtered = this.filterInvoicesByCurrency(filtered, currency);
    filtered = this.filterInvoicesBySearch(filtered, searchTerm);
    
    return filtered.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }

  static groupInvoices(
    invoices: Invoice[],
    groupBy: 'none' | 'month' | 'client' | 'currency' | 'status'
  ): Array<{ key: string; name: string; invoices: Invoice[] }> {
    if (groupBy === 'none') {
      return [{ key: 'All Invoices', name: 'All Invoices', invoices }];
    }

    const grouped: { [key: string]: Invoice[] } = {};

    invoices.forEach(invoice => {
      let groupKey = '';
      
      switch (groupBy) {
        case 'month':
          const date = new Date(invoice.issueDate);
          groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'client':
          groupKey = invoice.clientName || 'Unknown Client';
          break;
        case 'currency':
          groupKey = invoice.currency;
          break;
        case 'status':
          groupKey = invoice.status;
          break;
        default:
          groupKey = 'All Invoices';
      }

      if (groupKey) {
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(invoice);
      }
    });

    return Object.entries(grouped)
      .map(([key, invoices]) => ({ key, name: this.formatGroupName(key, groupBy), invoices }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private static formatGroupName(key: string, groupBy: 'month' | 'client' | 'currency' | 'status'): string {
    switch (groupBy) {
      case 'month':
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      case 'status':
        return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
      default:
        return key;
    }
  }

  static calculateSummary(invoices: Invoice[]): {
    totalInvoices: number;
    totalValue: number;
    draftCount: number;
    sentCount: number;
    paidCount: number;
    overdueCount: number;
    thisMonth: number;
  } {
    const totalValue = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const draftCount = invoices.filter(invoice => invoice.status === 'DRAFT').length;
    const sentCount = invoices.filter(invoice => invoice.status === 'SENT').length;
    const paidCount = invoices.filter(invoice => invoice.status === 'PAID').length;
    const overdueCount = invoices.filter(invoice => invoice.status === 'OVERDUE').length;
    
    return {
      totalInvoices: invoices.length,
      totalValue,
      draftCount,
      sentCount,
      paidCount,
      overdueCount,
      thisMonth: invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.issueDate);
        const now = new Date();
        return invoiceDate.getMonth() === now.getMonth() && 
               invoiceDate.getFullYear() === now.getFullYear();
      }).length
    };
  }
}