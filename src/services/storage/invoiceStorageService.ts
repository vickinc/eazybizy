import { Invoice, LegacyInvoice, InvoiceUpdateResult } from '@/types/invoice.types';
import { getTodayString } from '@/utils/dateUtils';

const STORAGE_KEY = 'app-invoices';

export class InvoiceStorageService {
  /**
   * Get all invoices from localStorage
   */
  static getInvoices(): Invoice[] {
    try {
      const savedInvoices = localStorage.getItem(STORAGE_KEY);
      if (!savedInvoices) {
        return [];
      }
      
      const parsedInvoices = JSON.parse(savedInvoices);
      return this.migrateInvoices(parsedInvoices);
    } catch (error) {
      console.error('Error loading invoices from localStorage:', error);
      return [];
    }
  }

  /**
   * Save invoices to localStorage
   */
  static saveInvoices(invoices: Invoice[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
      
      // Dispatch custom event for cross-component updates
      window.dispatchEvent(new CustomEvent('invoicesUpdated', { 
        detail: { invoices } 
      }));
    } catch (error) {
      console.error('Error saving invoices to localStorage:', error);
      throw new Error('Failed to save invoices');
    }
  }

  /**
   * Add a new invoice
   */
  static addInvoice(invoice: Invoice): Invoice[] {
    const invoices = this.getInvoices();
    const updatedInvoices = [invoice, ...invoices];
    this.saveInvoices(updatedInvoices);
    return updatedInvoices;
  }

  /**
   * Update an existing invoice
   */
  static updateInvoice(updatedInvoice: Invoice): InvoiceUpdateResult {
    try {
      const invoices = this.getInvoices();
      const invoiceIndex = invoices.findIndex(inv => inv.id === updatedInvoice.id);
      
      if (invoiceIndex === -1) {
        return {
          success: false,
          error: 'Invoice not found'
        };
      }
      
      invoices[invoiceIndex] = updatedInvoice;
      this.saveInvoices(invoices);
      
      return {
        success: true,
        invoice: updatedInvoice
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update invoice'
      };
    }
  }

  /**
   * Delete an invoice
   */
  static deleteInvoice(invoiceId: string): Invoice[] {
    const invoices = this.getInvoices();
    const updatedInvoices = invoices.filter(inv => inv.id !== invoiceId);
    this.saveInvoices(updatedInvoices);
    return updatedInvoices;
  }

  /**
   * Archive an invoice
   */
  static archiveInvoice(invoiceId: string): Invoice[] {
    const invoices = this.getInvoices();
    const updatedInvoices = invoices.map(invoice => 
      invoice.id === invoiceId 
        ? { ...invoice, status: 'archived' as const }
        : invoice
    );
    this.saveInvoices(updatedInvoices);
    return updatedInvoices;
  }

  /**
   * Restore an archived invoice
   */
  static restoreInvoice(invoiceId: string): Invoice[] {
    const invoices = this.getInvoices();
    const updatedInvoices = invoices.map(invoice => 
      invoice.id === invoiceId 
        ? { ...invoice, status: 'draft' as const }
        : invoice
    );
    this.saveInvoices(updatedInvoices);
    return updatedInvoices;
  }

  /**
   * Mark an invoice as paid
   */
  static markInvoiceAsPaid(invoiceId: string, paidDate?: string): Invoice[] {
    const invoices = this.getInvoices();
    const updatedInvoices = invoices.map(invoice => 
      invoice.id === invoiceId 
        ? { 
            ...invoice, 
            status: 'paid' as const,
            paidDate: paidDate || getTodayString()
          }
        : invoice
    );
    this.saveInvoices(updatedInvoices);
    return updatedInvoices;
  }

  /**
   * Mark an invoice as sent
   */
  static markInvoiceAsSent(invoiceId: string): Invoice[] {
    const invoices = this.getInvoices();
    const updatedInvoices = invoices.map(invoice => 
      invoice.id === invoiceId 
        ? { ...invoice, status: 'sent' as const }
        : invoice
    );
    this.saveInvoices(updatedInvoices);
    return updatedInvoices;
  }

  /**
   * Update invoice status
   */
  static updateInvoiceStatus(invoiceId: string, status: Invoice['status'], paidDate?: string): Invoice[] {
    const invoices = this.getInvoices();
    const updatedInvoices = invoices.map(invoice => {
      if (invoice.id === invoiceId) {
        const updates: Partial<Invoice> = { status };
        
        // Set paid date if marking as paid
        if (status === 'paid' && !invoice.paidDate) {
          updates.paidDate = paidDate || getTodayString();
        }
        
        // Clear paid date if changing from paid to another status
        if (status !== 'paid' && invoice.paidDate) {
          updates.paidDate = undefined;
        }
        
        return { ...invoice, ...updates };
      }
      return invoice;
    });
    
    this.saveInvoices(updatedInvoices);
    return updatedInvoices;
  }

  /**
   * Get invoice by ID
   */
  static getInvoiceById(invoiceId: string): Invoice | undefined {
    const invoices = this.getInvoices();
    return invoices.find(inv => inv.id === invoiceId);
  }

  /**
   * Check if invoice number exists
   */
  static invoiceNumberExists(invoiceNumber: string, excludeId?: string): boolean {
    const invoices = this.getInvoices();
    return invoices.some(inv => 
      inv.invoiceNumber === invoiceNumber && 
      (!excludeId || inv.id !== excludeId)
    );
  }

  /**
   * Get next available invoice number
   */
  static getNextInvoiceNumber(prefix: string = 'INV'): string {
    const invoices = this.getInvoices();
    const currentYear = new Date().getFullYear();
    
    // Find existing invoice numbers for current year
    const yearPrefix = `${prefix}-${currentYear}`;
    const existingNumbers = invoices
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
   * Get invoices for a specific client
   */
  static getInvoicesByClient(clientName: string): Invoice[] {
    const invoices = this.getInvoices();
    return invoices.filter(inv => inv.clientName === clientName);
  }

  /**
   * Get invoices for a specific company
   */
  static getInvoicesByCompany(companyId: number): Invoice[] {
    const invoices = this.getInvoices();
    return invoices.filter(inv => inv.fromCompanyId === companyId);
  }

  /**
   * Get overdue invoices
   */
  static getOverdueInvoices(): Invoice[] {
    const invoices = this.getInvoices();
    const today = new Date();
    
    return invoices.filter(inv => {
      if (inv.status === 'paid' || inv.status === 'archived' || inv.status === 'draft') {
        return false;
      }
      
      const dueDate = new Date(inv.dueDate);
      return dueDate < today;
    });
  }

  /**
   * Update overdue status for all invoices
   */
  static updateOverdueStatus(): Invoice[] {
    const invoices = this.getInvoices();
    const today = new Date();
    
    const updatedInvoices = invoices.map(invoice => {
      // Only check sent invoices
      if (invoice.status !== 'sent') {
        return invoice;
      }
      
      const dueDate = new Date(invoice.dueDate);
      const isOverdue = dueDate < today;
      
      if (isOverdue && invoice.status === 'sent') {
        return { ...invoice, status: 'overdue' as const };
      }
      
      return invoice;
    });
    
    this.saveInvoices(updatedInvoices);
    return updatedInvoices;
  }

  /**
   * Bulk update invoice statuses
   */
  static bulkUpdateStatus(invoiceIds: string[], status: Invoice['status']): Invoice[] {
    const invoices = this.getInvoices();
    const updatedInvoices = invoices.map(invoice => {
      if (invoiceIds.includes(invoice.id)) {
        const updates: Partial<Invoice> = { status };
        
        // Set paid date if marking as paid
        if (status === 'paid' && !invoice.paidDate) {
          updates.paidDate = getTodayString();
        }
        
        return { ...invoice, ...updates };
      }
      return invoice;
    });
    
    this.saveInvoices(updatedInvoices);
    return updatedInvoices;
  }

  /**
   * Migrate legacy invoices to new format
   */
  static migrateInvoices(invoices: (Invoice | LegacyInvoice)[]): Invoice[] {
    return invoices.map(invoice => {
      // If already in new format, return as is
      if ('items' in invoice && Array.isArray(invoice.items)) {
        // Ensure all required fields exist
        return {
          ...invoice,
          items: invoice.items || [],
          subtotal: invoice.subtotal || 0,
          taxAmount: invoice.taxAmount || 0,
          totalAmount: invoice.totalAmount || invoice.subtotal || 0,
          notes: invoice.notes || '',
          template: invoice.template || 'professional',
          paymentMethodIds: invoice.paymentMethodIds || [],
          // Set paid date for existing paid invoices if not already set
          paidDate: invoice.status === 'paid' && !invoice.paidDate 
            ? invoice.issueDate || getTodayString()
            : invoice.paidDate,
          // Set created date for existing invoices if not already set
          createdAt: invoice.createdAt || invoice.issueDate || getTodayString()
        } as Invoice;
      }
      
      // Migrate legacy format
      const legacyInvoice = invoice as LegacyInvoice;
      const amount = legacyInvoice.amount || 0;
      const taxRate = legacyInvoice.taxRate || 0;
      const taxAmount = (amount * taxRate) / 100;
      const totalAmount = amount + taxAmount;
      
      return {
        id: legacyInvoice.id,
        invoiceNumber: legacyInvoice.invoiceNumber,
        clientName: legacyInvoice.clientName,
        clientEmail: legacyInvoice.clientEmail,
        clientAddress: '',
        items: legacyInvoice.description ? [{
          productId: 'legacy',
          productName: 'Legacy Service',
          description: legacyInvoice.description,
          quantity: 1,
          unitPrice: amount,
          currency: legacyInvoice.currency || 'USD',
          total: amount
        }] : [],
        subtotal: amount,
        currency: legacyInvoice.currency || 'USD',
        status: legacyInvoice.status as Invoice['status'],
        dueDate: legacyInvoice.dueDate,
        issueDate: legacyInvoice.issueDate,
        paidDate: legacyInvoice.status === 'paid' 
          ? legacyInvoice.issueDate || getTodayString()
          : undefined,
        createdAt: legacyInvoice.issueDate || getTodayString(),
        template: legacyInvoice.template || 'professional',
        taxRate: taxRate,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
        fromCompanyId: legacyInvoice.fromCompanyId,
        paymentMethodIds: [],
        notes: ''
      } as Invoice;
    });
  }

  /**
   * Clear all invoices (for testing/reset purposes)
   */
  static clearAllInvoices(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Export invoices as JSON
   */
  static exportInvoices(): string {
    const invoices = this.getInvoices();
    return JSON.stringify(invoices, null, 2);
  }

  /**
   * Import invoices from JSON
   */
  static importInvoices(jsonData: string): Invoice[] {
    try {
      const importedInvoices = JSON.parse(jsonData);
      const migratedInvoices = this.migrateInvoices(importedInvoices);
      this.saveInvoices(migratedInvoices);
      return migratedInvoices;
    } catch (error) {
      console.error('Error importing invoices:', error);
      throw new Error('Failed to import invoices');
    }
  }

  /**
   * Get storage statistics
   */
  static getStorageStats(): {
    totalInvoices: number;
    storageSize: number;
    lastUpdated: string | null;
  } {
    const invoices = this.getInvoices();
    const storageData = localStorage.getItem(STORAGE_KEY);
    
    return {
      totalInvoices: invoices.length,
      storageSize: storageData ? new Blob([storageData]).size : 0,
      lastUpdated: new Date().toISOString()
    };
  }
}