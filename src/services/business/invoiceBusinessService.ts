import { 
  Invoice, 
  FormattedInvoice, 
  InvoiceFormData, 
  InvoiceFilters, 
  InvoiceStatistics, 
  InvoiceCalculation,
  ExchangeRates,
  INVOICE_STATUSES,
  ViewMode,
  PaidPeriod,
  SortField,
  SortDirection
} from '@/types/invoice.types';
import { Company } from '@/types/company.types';
import { Client } from '@/types/client.types';
import { Product } from '@/types/products.types';
import { formatDateForDisplay, getTodayString } from '@/utils/dateUtils';

export class InvoiceBusinessService {
  /**
   * Get current exchange rates from localStorage
   */
  static getExchangeRates(): ExchangeRates {
    try {
      const fiatRates = localStorage.getItem('app-fiat-rates');
      const cryptoRates = localStorage.getItem('app-crypto-rates');
      
      const rates: ExchangeRates = { 'USD': 1 }; // USD is always 1
      
      if (fiatRates) {
        const fiatData = JSON.parse(fiatRates);
        fiatData.forEach((currency: unknown) => {
          rates[currency.code] = currency.rate;
        });
      }
      
      if (cryptoRates) {
        const cryptoData = JSON.parse(cryptoRates);
        cryptoData.forEach((currency: unknown) => {
          rates[currency.code] = currency.rate;
        });
      }
      
      return rates;
    } catch (error) {
      console.error('Error loading exchange rates:', error);
      return this.getFallbackExchangeRates();
    }
  }

  /**
   * Get fallback exchange rates if main rates fail to load
   */
  static getFallbackExchangeRates(): ExchangeRates {
    return {
      'USD': 1, 'EUR': 1.09, 'GBP': 1.27, 'JPY': 0.0067, 'AUD': 0.66, 'CAD': 0.74,
      'CHF': 1.12, 'CNY': 0.14, 'SEK': 0.096, 'NZD': 0.60, 'MXN': 0.058, 'SGD': 0.74,
      'HKD': 0.13, 'NOK': 0.092, 'DKK': 0.146, 'PLN': 0.24, 'CZK': 0.044, 'HUF': 0.0027,
      'ILS': 0.27, 'CLP': 0.0010, 'PHP': 0.018, 'AED': 0.27, 'COP': 0.00025, 'SAR': 0.27,
      'MYR': 0.22, 'RON': 0.22, 'THB': 0.028, 'TRY': 0.034, 'BRL': 0.17, 'TWD': 0.031,
      'ZAR': 0.055, 'KRW': 0.00075, 'INR': 0.012, 'RUB': 0.011, 'BGN': 0.56, 'HRK': 0.145,
      'IDR': 0.000065, 'ISK': 0.0072
    };
  }

  /**
   * Convert amount from any currency to USD
   */
  static convertToUSD(amount: number, fromCurrency: string, rates: ExchangeRates): number {
    const rate = rates[fromCurrency];
    if (!rate) {
      console.warn(`Exchange rate not found for ${fromCurrency}, using 1:1 rate`);
      return amount;
    }
    return amount * rate;
  }

  /**
   * Convert amount from one currency to another
   */
  static convertCurrency(amount: number, fromCurrency: string, toCurrency: string, rates: ExchangeRates): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    // Convert to USD first, then to target currency
    const amountInUSD = this.convertToUSD(amount, fromCurrency, rates);
    
    // Convert from USD to target currency
    const toRate = rates[toCurrency];
    if (!toRate) {
      console.warn(`Exchange rate not found for ${toCurrency}, using 1:1 rate`);
      return amountInUSD;
    }
    
    return amountInUSD / toRate;
  }

  /**
   * Calculate invoice totals
   */
  static calculateInvoiceTotals(
    items: InvoiceFormData['items'],
    products: Product[],
    taxRate: number,
    rates: ExchangeRates
  ): InvoiceCalculation {
    const subtotal = 0;
    let currency = 'USD'; // Default currency
    
    // Determine the primary currency first (from the first item)
    const firstProduct = items.length > 0 ? products.find(p => p.id === items[0].productId) : null;
    if (firstProduct) {
      currency = firstProduct.currency;
    }
    
    // Calculate subtotal in the invoice's native currency
    items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const quantity = parseFloat(item.quantity) || 0;
        const itemTotal = product.price * quantity;
        
        // Convert to invoice currency if needed, otherwise use the item's amount directly
        if (product.currency === currency) {
          subtotal += itemTotal;
        } else {
          // Convert from product currency to invoice currency
          const itemTotalInInvoiceCurrency = this.convertCurrency(itemTotal, product.currency, currency, rates);
          subtotal += itemTotalInInvoiceCurrency;
        }
      }
    });
    
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;
    
    return {
      subtotal,
      taxAmount,
      totalAmount,
      currency
    };
  }

  /**
   * Create a new invoice from form data
   */
  static createInvoice(
    formData: InvoiceFormData,
    products: Product[],
    clients: Client[],
    companies: Company[],
    rates: ExchangeRates
  ): Invoice {
    const client = clients.find(c => c.id === formData.clientId);
    const companyId = typeof formData.fromCompanyId === 'string' ? parseInt(formData.fromCompanyId, 10) : formData.fromCompanyId;
    const company = companies.find(c => c.id === companyId);
    
    if (!client) {
      throw new Error('Client not found');
    }
    
    if (!company) {
      throw new Error('Company not found');
    }
    
    const taxRate = parseFloat(formData.taxRate) || 0;
    const calculations = this.calculateInvoiceTotals(formData.items, products, taxRate, rates);
    
    // Build invoice items with product details
    const invoiceItems = formData.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      
      const quantity = parseFloat(item.quantity) || 0;
      const total = product.price * quantity;
      
      return {
        productId: product.id,
        productName: product.name,
        description: product.description,
        quantity: quantity,
        unitPrice: product.price,
        currency: product.currency,
        total: total
      };
    });
    
    return {
      id: Date.now().toString(),
      invoiceNumber: formData.invoiceNumber,
      clientName: client.name,
      clientEmail: client.email,
      clientAddress: this.formatClientAddress(client),
      items: invoiceItems,
      subtotal: calculations.subtotal,
      currency: calculations.currency,
      status: 'draft',
      dueDate: formData.dueDate,
      issueDate: formData.issueDate,
      createdAt: new Date().toISOString(),
      template: 'professional',
      taxRate: taxRate,
      taxAmount: calculations.taxAmount,
      totalAmount: calculations.totalAmount,
      fromCompanyId: companyId,
      paymentMethodIds: formData.paymentMethodIds,
      notes: formData.notes
    };
  }

  /**
   * Update an existing invoice
   */
  static updateInvoice(
    existingInvoice: Invoice,
    formData: InvoiceFormData,
    products: Product[],
    clients: Client[],
    companies: Company[],
    rates: ExchangeRates
  ): Invoice {
    const client = clients.find(c => c.id === formData.clientId);
    const companyId = typeof formData.fromCompanyId === 'string' ? parseInt(formData.fromCompanyId, 10) : formData.fromCompanyId;
    const company = companies.find(c => c.id === companyId);
    
    if (!client) {
      throw new Error('Client not found');
    }
    
    if (!company) {
      throw new Error('Company not found');
    }
    
    const taxRate = parseFloat(formData.taxRate) || 0;
    const calculations = this.calculateInvoiceTotals(formData.items, products, taxRate, rates);
    
    // Build invoice items with product details
    const invoiceItems = formData.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      
      const quantity = parseFloat(item.quantity) || 0;
      const total = product.price * quantity;
      
      return {
        productId: product.id,
        productName: product.name,
        description: product.description,
        quantity: quantity,
        unitPrice: product.price,
        currency: product.currency,
        total: total
      };
    });
    
    return {
      ...existingInvoice,
      invoiceNumber: formData.invoiceNumber,
      clientName: client.name,
      clientEmail: client.email,
      clientAddress: this.formatClientAddress(client),
      items: invoiceItems,
      subtotal: calculations.subtotal,
      currency: calculations.currency,
      dueDate: formData.dueDate,
      issueDate: formData.issueDate,
      taxRate: taxRate,
      taxAmount: calculations.taxAmount,
      totalAmount: calculations.totalAmount,
      fromCompanyId: companyId,
      paymentMethodIds: formData.paymentMethodIds,
      notes: formData.notes
    };
  }

  /**
   * Format client address for invoice
   */
  static formatClientAddress(client: Client): string {
    const parts = [
      client.address,
      client.city,
      client.zipCode,
      client.country
    ].filter(part => part && part.trim());
    
    return parts.join(', ');
  }

  /**
   * Format invoice for display with all computed fields
   */
  static formatInvoiceForDisplay(
    invoice: Invoice,
    companies: Company[],
    clients: Client[],
    paymentMethods: unknown[]
  ): FormattedInvoice {
    const company = companies.find(c => c.id === invoice.fromCompanyId);
    const client = clients.find(c => c.clientName === invoice.clientName || c.name === invoice.clientName);
    
    // Get status configuration
    const statusConfig = INVOICE_STATUSES.find(s => s.value === invoice.status) || INVOICE_STATUSES[0];
    
    // Calculate date-related fields
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const issueDate = new Date(invoice.issueDate);
    
    const daysToDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = dueDate < today && invoice.status === 'sent';
    const daysOverdue = isOverdue ? Math.abs(daysToDue) : undefined;
    
    // Format monetary values
    const currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    // Get payment method names
    const invoicePaymentMethods = paymentMethods.filter(pm => 
      invoice.paymentMethodIds?.includes(pm.id)
    );
    const paymentMethodNames = invoicePaymentMethods.map(pm => pm.name);
    
    return {
      ...invoice,
      // Pre-formatted display data
      formattedSubtotal: currencyFormatter.format(invoice.subtotal),
      formattedTaxAmount: currencyFormatter.format(invoice.taxAmount),
      formattedTotalAmount: currencyFormatter.format(invoice.totalAmount),
      formattedIssueDate: formatDateForDisplay(invoice.issueDate),
      formattedDueDate: formatDateForDisplay(invoice.dueDate),
      formattedPaidDate: invoice.paidDate ? formatDateForDisplay(invoice.paidDate) : undefined,
      formattedCreatedAt: invoice.createdAt ? formatDateForDisplay(invoice.createdAt) : undefined,
      
      // Status configuration
      statusConfig: {
        value: statusConfig.value,
        label: statusConfig.label,
        color: statusConfig.color,
        bgColor: statusConfig.bgColor
      },
      
      // Computed fields
      daysOverdue,
      isOverdue,
      daysToDue,
      
      // Company information
      companyInfo: company ? {
        id: company.id,
        tradingName: company.tradingName,
        legalName: company.legalName,
        logo: company.logo
      } : undefined,
      
      // Client information
      clientInfo: client ? {
        id: client.id,
        name: client.name,
        email: client.email,
        type: client.clientType
      } : undefined,
      
      // Payment method names for display
      paymentMethodNames
    };
  }

  /**
   * Filter invoices based on criteria
   */
  static filterInvoices(invoices: Invoice[], filters: InvoiceFilters): Invoice[] {
    return invoices.filter(invoice => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
          invoice.clientName.toLowerCase().includes(searchLower) ||
          invoice.clientEmail.toLowerCase().includes(searchLower) ||
          invoice.notes?.toLowerCase().includes(searchLower) ||
          invoice.items.some(item => 
            item.productName.toLowerCase().includes(searchLower) ||
            item.description.toLowerCase().includes(searchLower)
          );
        
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (filters.statusFilter !== 'all' && invoice.status !== filters.statusFilter) {
        return false;
      }
      
      // Company filter
      if (filters.companyFilter !== 'all' && invoice.fromCompanyId !== filters.companyFilter) {
        return false;
      }
      
      // Client filter
      if (filters.clientFilter && filters.clientFilter !== 'all') {
        if (invoice.clientName !== filters.clientFilter) {
          return false;
        }
      }
      
      // Currency filter
      if (filters.currencyFilter && filters.currencyFilter !== 'all') {
        if (invoice.currency !== filters.currencyFilter) {
          return false;
        }
      }
      
      // Date range filter
      if (filters.dateRangeFilter && filters.dateRangeFilter !== 'all') {
        const invoiceDate = new Date(invoice.issueDate);
        const now = new Date();
        
        switch (filters.dateRangeFilter) {
          case 'thisMonth':
            if (invoiceDate.getMonth() !== now.getMonth() || 
                invoiceDate.getFullYear() !== now.getFullYear()) {
              return false;
            }
            break;
          case 'lastMonth':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
            if (invoiceDate.getMonth() !== lastMonth.getMonth() || 
                invoiceDate.getFullYear() !== lastMonth.getFullYear()) {
              return false;
            }
            break;
          case 'thisYear':
            if (invoiceDate.getFullYear() !== now.getFullYear()) {
              return false;
            }
            break;
          case 'lastYear':
            if (invoiceDate.getFullYear() !== now.getFullYear() - 1) {
              return false;
            }
            break;
        }
      }
      
      return true;
    });
  }

  /**
   * Calculate invoice statistics
   */
  static calculateStatistics(invoices: Invoice[], rates: ExchangeRates): InvoiceStatistics {
    const stats = {
      total: invoices.length,
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      archived: 0,
      totalValue: 0,
      paidValue: 0,
      overdueValue: 0,
      averageValue: 0
    };
    
    // Calculate counts and values
    invoices.forEach(invoice => {
      // Count by status
      switch (invoice.status) {
        case 'draft':
          stats.draft++;
          break;
        case 'sent':
          stats.sent++;
          break;
        case 'paid':
          stats.paid++;
          break;
        case 'overdue':
          stats.overdue++;
          break;
        case 'archived':
          stats.archived++;
          break;
      }
      
      // Convert amounts to USD for aggregation
      const totalAmountUSD = this.convertToUSD(invoice.totalAmount, invoice.currency, rates);
      
      // Add to total value
      stats.totalValue += totalAmountUSD;
      
      // Add to paid value
      if (invoice.status === 'paid') {
        stats.paidValue += totalAmountUSD;
      }
      
      // Add to overdue value
      if (invoice.status === 'overdue') {
        stats.overdueValue += totalAmountUSD;
      }
    });
    
    // Calculate average
    stats.averageValue = stats.total > 0 ? stats.totalValue / stats.total : 0;
    
    // Format monetary values
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return {
      ...stats,
      totalValueFormatted: formatter.format(stats.totalValue),
      paidValueFormatted: formatter.format(stats.paidValue),
      overdueValueFormatted: formatter.format(stats.overdueValue),
      averageValueFormatted: formatter.format(stats.averageValue)
    };
  }

  /**
   * Update overdue invoices based on current date
   */
  static updateOverdueInvoices(invoices: Invoice[]): { updatedInvoices: Invoice[]; updatedCount: number } {
    const today = new Date();
    const updatedCount = 0;
    
    const updatedInvoices = invoices.map(invoice => {
      // Only check sent invoices
      if (invoice.status !== 'sent') {
        return invoice;
      }
      
      const dueDate = new Date(invoice.dueDate);
      const isOverdue = dueDate < today;
      
      if (isOverdue) {
        updatedCount++;
        return { ...invoice, status: 'overdue' as const };
      }
      
      return invoice;
    });
    
    return { updatedInvoices, updatedCount };
  }

  /**
   * Filter invoices by view mode and paid period
   */
  static filterByViewMode(invoices: Invoice[], viewMode: ViewMode, paidPeriod?: PaidPeriod): Invoice[] {
    let filtered = invoices;
    
    // Apply view mode filter
    switch (viewMode) {
      case 'active':
        filtered = invoices.filter(inv => inv.status !== 'archived' && inv.status !== 'paid');
        break;
      case 'paid':
        filtered = invoices.filter(inv => inv.status === 'paid');
        break;
      case 'archived':
        filtered = invoices.filter(inv => inv.status === 'archived');
        break;
    }
    
    // Apply paid period filter if in paid view mode
    if (viewMode === 'paid' && paidPeriod && paidPeriod !== 'allTime') {
      const now = new Date();
      
      filtered = filtered.filter(invoice => {
        if (!invoice.paidDate) return false;
        
        const paidDate = new Date(invoice.paidDate);
        
        switch (paidPeriod) {
          case 'today':
            return paidDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return paidDate >= weekAgo;
          case 'thisMonth':
            return paidDate.getMonth() === now.getMonth() && 
                   paidDate.getFullYear() === now.getFullYear();
          case 'lastMonth':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
            return paidDate.getMonth() === lastMonth.getMonth() && 
                   paidDate.getFullYear() === lastMonth.getFullYear();
          case 'last6Months':
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6);
            return paidDate >= sixMonthsAgo;
          case 'thisYear':
            return paidDate.getFullYear() === now.getFullYear();
          case 'lastYear':
            return paidDate.getFullYear() === now.getFullYear() - 1;
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }

  /**
   * Get unique currencies from invoices
   */
  static getUniqueCurrencies(invoices: Invoice[]): string[] {
    const currencies = new Set(invoices.map(inv => inv.currency));
    return Array.from(currencies).sort();
  }

  /**
   * Get unique clients from invoices
   */
  static getUniqueClients(invoices: Invoice[]): string[] {
    const clients = new Set(invoices.map(inv => inv.clientName));
    return Array.from(clients).sort();
  }

  /**
   * Generate next invoice number
   */
  static generateInvoiceNumber(existingInvoices: Invoice[], prefix: string = 'INV'): string {
    const currentYear = new Date().getFullYear();
    const yearPrefix = `${prefix}-${currentYear}`;
    
    // Find existing invoice numbers for current year
    const existingNumbers = existingInvoices
      .filter(inv => inv.invoiceNumber.startsWith(yearPrefix))
      .map(inv => {
        const numberPart = inv.invoiceNumber.replace(`${yearPrefix}-`, '');
        return parseInt(numberPart, 10);
      })
      .filter(num => !isNaN(num))
      .sort((a, b) => b - a);
    
    const nextNumber = existingNumbers.length > 0 ? existingNumbers[0] + 1 : 1;
    return `${yearPrefix}-${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate invoice age in days
   */
  static calculateInvoiceAge(invoice: Invoice): number {
    const today = new Date();
    const issueDate = new Date(invoice.issueDate);
    return Math.floor((today.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Sort invoices by specified field and direction
   */
  static sortInvoices(
    invoices: FormattedInvoice[], 
    sortField: SortField, 
    sortDirection: SortDirection
  ): FormattedInvoice[] {
    const sorted = [...invoices].sort((a, b) => {
      let aValue: unknown;
      let bValue: unknown;

      switch (sortField) {
        case 'createdAt':
          aValue = new Date(a.createdAt || a.issueDate).getTime();
          bValue = new Date(b.createdAt || b.issueDate).getTime();
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate).getTime();
          bValue = new Date(b.dueDate).getTime();
          break;
        case 'invoiceNumber':
          aValue = a.invoiceNumber.toLowerCase();
          bValue = b.invoiceNumber.toLowerCase();
          break;
        case 'company':
          aValue = a.companyInfo?.tradingName?.toLowerCase() || '';
          bValue = b.companyInfo?.tradingName?.toLowerCase() || '';
          break;
        case 'client':
          aValue = a.clientName.toLowerCase();
          bValue = b.clientName.toLowerCase();
          break;
        case 'amount':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }

  /**
   * Calculate invoice amount conversions for payment methods with different currencies
   */
  static calculatePaymentCurrencyConversions(
    invoice: Invoice,
    paymentMethods: unknown[],
    rates: ExchangeRates
  ): Array<{
    currency: string;
    amount: number;
    formattedAmount: string;
    rate: number;
    paymentMethodNames: string[];
  }> {
    // Get payment methods for this invoice
    const invoicePaymentMethods = paymentMethods.filter(pm => 
      invoice.paymentMethodIds?.includes(pm.id)
    );
    
    // Group payment methods by currency
    const currencyGroups = new Map<string, { methods: unknown[]; names: string[] }>();
    
    invoicePaymentMethods.forEach(method => {
      const currency = method.currency;
      if (!currency || currency === invoice.currency) {
        // Skip if no currency or same as invoice currency
        return;
      }
      
      if (!currencyGroups.has(currency)) {
        currencyGroups.set(currency, { methods: [], names: [] });
      }
      
      const group = currencyGroups.get(currency)!;
      group.methods.push(method);
      group.names.push(method.name || `${method.bankName} (${method.accountName})`);
    });
    
    // Calculate conversions for each unique currency
    const conversions: Array<{
      currency: string;
      amount: number;
      formattedAmount: string;
      rate: number;
      paymentMethodNames: string[];
    }> = [];
    
    currencyGroups.forEach((group, currency) => {
      const convertedAmount = this.convertCurrency(
        invoice.totalAmount,
        invoice.currency,
        currency,
        rates
      );
      
      // Calculate the effective rate
      const rate = convertedAmount / invoice.totalAmount;
      
      // Format the converted amount
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
      conversions.push({
        currency,
        amount: convertedAmount,
        formattedAmount: formatter.format(convertedAmount),
        rate: rate,
        paymentMethodNames: group.names
      });
    });
    
    return conversions;
  }

  /**
   * Get invoice payment status summary
   */
  static getPaymentStatusSummary(invoices: Invoice[], rates: ExchangeRates): {
    pending: { count: number; value: number; valueFormatted: string };
    overdue: { count: number; value: number; valueFormatted: string };
    paid: { count: number; value: number; valueFormatted: string };
  } {
    const summary = {
      pending: { count: 0, value: 0 },
      overdue: { count: 0, value: 0 },
      paid: { count: 0, value: 0 }
    };
    
    invoices.forEach(invoice => {
      const valueUSD = this.convertToUSD(invoice.totalAmount, invoice.currency, rates);
      
      switch (invoice.status) {
        case 'sent':
          summary.pending.count++;
          summary.pending.value += valueUSD;
          break;
        case 'overdue':
          summary.overdue.count++;
          summary.overdue.value += valueUSD;
          break;
        case 'paid':
          summary.paid.count++;
          summary.paid.value += valueUSD;
          break;
      }
    });
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    });
    
    return {
      pending: {
        ...summary.pending,
        valueFormatted: formatter.format(summary.pending.value)
      },
      overdue: {
        ...summary.overdue,
        valueFormatted: formatter.format(summary.overdue.value)
      },
      paid: {
        ...summary.paid,
        valueFormatted: formatter.format(summary.paid.value)
      }
    };
  }
}