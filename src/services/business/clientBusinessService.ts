import { 
  Client, 
  FormattedClient, 
  ClientFilters, 
  ClientStatistics, 
  NewClient,
  CLIENT_STATUSES 
} from '@/types/client.types';
import { Company } from '@/types/company.types';
import { getLocalDateTimeString, formatDateForDisplay } from '@/utils';

export class ClientBusinessService {
  static formatClientForDisplay(
    client: Client,
    companies: Company[]
  ): FormattedClient {
    // Get company information if client has a company
    const companyInfo = client.companyId 
      ? companies.find(c => c.id === client.companyId)
      : undefined;

    // Format address
    const addressParts = [client.address, client.city, client.zipCode, client.country].filter(Boolean);
    const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : 'No address';

    // Format monetary values
    const formattedTotalInvoiced = `USD ${client.totalInvoiced.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
    const formattedTotalPaid = `USD ${client.totalPaid.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;

    // Format dates
    const formattedCreatedAt = formatDateForDisplay(client.createdAt.split('T')[0]);
    const formattedLastInvoiceDate = client.lastInvoiceDate 
      ? formatDateForDisplay(client.lastInvoiceDate.split('T')[0])
      : undefined;

    // Pre-construct links
    const emailLink = `mailto:${client.email}`;
    const phoneLink = client.phone ? `tel:${client.phone}` : '';
    const websiteUrl = client.website 
      ? (client.website.startsWith('http') ? client.website : `https://${client.website}`)
      : '';

    // Get status configuration
    const statusConfig = CLIENT_STATUSES.find(s => s.value === client.status) || CLIENT_STATUSES[0];

    return {
      ...client,
      companyInfo: companyInfo ? {
        id: companyInfo.id,
        tradingName: companyInfo.tradingName,
        legalName: companyInfo.legalName,
        logo: companyInfo.logo
      } : undefined,
      formattedAddress,
      formattedTotalInvoiced,
      formattedTotalPaid,
      formattedCreatedAt,
      formattedLastInvoiceDate,
      emailLink,
      phoneLink,
      websiteUrl,
      statusConfig
    };
  }

  static filterClients(
    clients: Client[],
    filters: ClientFilters
  ): Client[] {
    return clients.filter(client => {
      // Filter by company
      const matchesCompany = filters.companyFilter === 'all' || 
                            client.companyId === filters.companyFilter;
      
      // Filter by search term
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch = !filters.searchTerm.trim() ||
                           client.name.toLowerCase().includes(searchLower) ||
                           client.email.toLowerCase().includes(searchLower) ||
                           client.industry.toLowerCase().includes(searchLower) ||
                           (client.contactPersonName?.toLowerCase().includes(searchLower)) ||
                           (client.notes?.toLowerCase().includes(searchLower));
      
      // Filter by status
      const matchesStatus = filters.statusFilter === 'all' || 
                           client.status === filters.statusFilter;
      
      // Filter by industry
      const matchesIndustry = filters.industryFilter === 'all' || 
                             client.industry === filters.industryFilter;
      
      return matchesCompany && matchesSearch && matchesStatus && matchesIndustry;
    });
  }

  static calculateStatistics(clients: Client[]): ClientStatistics {
    const activeClients = clients.filter(c => c.status === 'active');
    const leadClients = clients.filter(c => c.status === 'lead');
    const archivedClients = clients.filter(c => c.status === 'archived');
    
    // Calculate total revenue from non-archived clients
    const totalRevenue = clients
      .filter(c => c.status !== 'archived')
      .reduce((sum, client) => sum + client.totalPaid, 0);

    return {
      total: clients.filter(c => c.status !== 'archived').length,
      active: activeClients.length,
      leads: leadClients.length,
      archived: archivedClients.length,
      totalRevenue
    };
  }

  static createClient(clientData: NewClient): Client {
    return {
      id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      companyId: typeof clientData.companyId === 'number' ? clientData.companyId : undefined,
      clientType: clientData.clientType,
      name: clientData.name.trim(),
      contactPersonName: clientData.contactPersonName.trim(),
      contactPersonPosition: clientData.contactPersonPosition.trim(),
      email: clientData.email.trim(),
      phone: clientData.phone.trim(),
      website: clientData.website.trim(),
      address: clientData.address.trim(),
      city: clientData.city.trim(),
      zipCode: clientData.zipCode.trim(),
      country: clientData.country.trim(),
      industry: clientData.industry,
      status: clientData.status,
      notes: clientData.notes.trim(),
      registrationNumber: clientData.registrationNumber.trim(),
      vatNumber: clientData.vatNumber.trim(),
      passportNumber: clientData.passportNumber.trim(),
      dateOfBirth: clientData.dateOfBirth,
      createdAt: getLocalDateTimeString(),
      totalInvoiced: 0,
      totalPaid: 0
    };
  }

  static updateClient(
    existingClient: Client, 
    clientData: NewClient
  ): Client {
    return {
      ...existingClient,
      companyId: typeof clientData.companyId === 'number' ? clientData.companyId : undefined,
      clientType: clientData.clientType,
      name: clientData.name.trim(),
      contactPersonName: clientData.contactPersonName.trim(),
      contactPersonPosition: clientData.contactPersonPosition.trim(),
      email: clientData.email.trim(),
      phone: clientData.phone.trim(),
      website: clientData.website.trim(),
      address: clientData.address.trim(),
      city: clientData.city.trim(),
      zipCode: clientData.zipCode.trim(),
      country: clientData.country.trim(),
      industry: clientData.industry,
      status: clientData.status,
      notes: clientData.notes.trim(),
      registrationNumber: clientData.registrationNumber.trim(),
      vatNumber: clientData.vatNumber.trim(),
      passportNumber: clientData.passportNumber.trim(),
      dateOfBirth: clientData.dateOfBirth
    };
  }

  // Currency conversion utilities
  static getExchangeRates(): { [key: string]: number } {
    try {
      const fiatRates = localStorage.getItem('app-fiat-rates');
      const cryptoRates = localStorage.getItem('app-crypto-rates');
      
      const rates: { [key: string]: number } = { 'USD': 1 }; // USD is always 1
      
      if (fiatRates) {
        const fiatData = JSON.parse(fiatRates);
        fiatData.forEach((currency: any) => {
          rates[currency.code] = currency.rate;
        });
      }
      
      if (cryptoRates) {
        const cryptoData = JSON.parse(cryptoRates);
        cryptoData.forEach((currency: any) => {
          rates[currency.code] = currency.rate;
        });
      }
      
      return rates;
    } catch (error) {
      console.error('Error loading exchange rates:', error);
      // Fallback to default rates
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
  }

  static convertToUSD(amount: number, fromCurrency: string, rates: { [key: string]: number }): number {
    const rate = rates[fromCurrency];
    if (!rate) {
      console.warn(`Exchange rate not found for ${fromCurrency}, using 1:1 rate`);
      return amount;
    }
    return amount * rate;
  }

  static updateClientTotalsFromInvoices(
    clients: Client[],
    invoices: any[],
    exchangeRates: { [key: string]: number }
  ): Client[] {
    return clients.map(client => {
      // Filter invoices for this client (excluding archived invoices)
      const clientInvoices = invoices.filter((inv: any) => 
        inv.clientName === client.name && inv.status !== 'archived'
      );
      
      // Calculate total invoiced amount (only 'sent' status invoices) - converted to USD
      const totalInvoiced = clientInvoices
        .filter((inv: any) => inv.status === 'sent')
        .reduce((sum: number, inv: any) => {
          const invoiceAmount = parseFloat(inv.totalAmount || inv.amount) || 0;
          const convertedAmount = this.convertToUSD(invoiceAmount, inv.currency || 'USD', exchangeRates);
          return sum + convertedAmount;
        }, 0);
      
      // Calculate total paid amount (only 'paid' status invoices) - converted to USD
      const totalPaid = clientInvoices
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => {
          const invoiceAmount = parseFloat(inv.totalAmount || inv.amount) || 0;
          const convertedAmount = this.convertToUSD(invoiceAmount, inv.currency || 'USD', exchangeRates);
          return sum + convertedAmount;
        }, 0);
      
      // Find the most recent invoice
      const lastInvoice = clientInvoices
        .sort((a: any, b: any) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())[0];
      
      // Auto-update status based on paid invoices in last 18 months
      const eighteenMonthsAgo = new Date();
      eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);
      
      const recentPaidInvoices = clientInvoices.filter((inv: any) => {
        if (inv.status !== 'paid') return false;
        const invoiceDate = new Date(inv.issueDate);
        return invoiceDate >= eighteenMonthsAgo;
      });
      
      let updatedStatus = client.status;
      
      // Promote to Active if client has paid invoices and is currently Lead or Inactive
      if (recentPaidInvoices.length > 0 && (client.status === 'lead' || client.status === 'inactive')) {
        updatedStatus = 'active';
      }
      // Demote to Lead if Active client no longer has paid invoices in last 18 months
      else if (recentPaidInvoices.length === 0 && client.status === 'active') {
        updatedStatus = 'lead';
      }
      
      return {
        ...client,
        status: updatedStatus,
        totalInvoiced,
        totalPaid,
        lastInvoiceDate: lastInvoice ? lastInvoice.issueDate : client.lastInvoiceDate
      };
    });
  }

  static updateAllClientStatuses(
    clients: Client[],
    invoices: any[]
  ): { updatedClients: Client[]; updatedCount: number } {
    const eighteenMonthsAgo = new Date();
    eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);

    let updatedCount = 0;

    const updatedClients = clients.map(client => {
      // Filter invoices for this client (excluding archived invoices)
      const clientInvoices = invoices.filter((inv: any) => 
        inv.clientName === client.name && inv.status !== 'archived'
      );

      // Check for recent paid invoices
      const recentPaidInvoices = clientInvoices.filter((inv: any) => {
        if (inv.status !== 'paid') return false;
        const invoiceDate = new Date(inv.issueDate);
        return invoiceDate >= eighteenMonthsAgo;
      });

      // Promote to Active if has paid invoices and is Lead/Inactive
      if (recentPaidInvoices.length > 0 && (client.status === 'lead' || client.status === 'inactive')) {
        updatedCount++;
        return { ...client, status: 'active' as const };
      }
      // Demote to Lead if Active but no paid invoices in 18 months
      else if (recentPaidInvoices.length === 0 && client.status === 'active') {
        updatedCount++;
        return { ...client, status: 'lead' as const };
      }

      return client;
    });

    return { updatedClients, updatedCount };
  }

  static getCompanyName(companyId: number, companies: Company[]): string {
    const company = companies.find(c => c.id === companyId);
    return company ? company.tradingName : 'Unknown Company';
  }
}