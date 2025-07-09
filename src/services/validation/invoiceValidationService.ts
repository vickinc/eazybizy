import { InvoiceFormData, Invoice, ValidationResult } from '@/types/invoice.types';
import { Product } from '@/types/products.types';
import { Client } from '@/types/client.types';
import { Company } from '@/types/company.types';

export class InvoiceValidationService {
  /**
   * Validate invoice form data for creation
   */
  static validateForCreation(
    formData: InvoiceFormData,
    existingInvoices: Invoice[],
    products: Product[],
    clients: Client[],
    companies: Company[]
  ): ValidationResult {
    const errors: string[] = [];
    
    // Validate basic invoice information
    const basicValidation = this.validateBasicInformation(formData);
    errors.push(...basicValidation);
    
    // Validate invoice number uniqueness
    const numberValidation = this.validateInvoiceNumber(formData.invoiceNumber, existingInvoices);
    errors.push(...numberValidation);
    
    // Validate client exists
    const clientValidation = this.validateClient(formData.clientId, clients);
    errors.push(...clientValidation);
    
    // Validate company exists
    const companyValidation = this.validateCompany(formData.fromCompanyId, companies);
    errors.push(...companyValidation);
    
    // Validate items
    const itemsValidation = this.validateItems(formData.items, products);
    errors.push(...itemsValidation);
    
    // Validate dates
    const dateValidation = this.validateDates(formData.issueDate, formData.dueDate);
    errors.push(...dateValidation);
    
    // Validate tax rate
    const taxValidation = this.validateTaxRate(formData.taxRate);
    errors.push(...taxValidation);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate invoice form data for update
   */
  static validateForUpdate(
    formData: InvoiceFormData,
    currentInvoice: Invoice,
    existingInvoices: Invoice[],
    products: Product[],
    clients: Client[],
    companies: Company[]
  ): ValidationResult {
    const errors: string[] = [];
    
    // Validate basic invoice information
    const basicValidation = this.validateBasicInformation(formData);
    errors.push(...basicValidation);
    
    // Validate invoice number uniqueness (excluding current invoice)
    const numberValidation = this.validateInvoiceNumber(
      formData.invoiceNumber, 
      existingInvoices, 
      currentInvoice.id
    );
    errors.push(...numberValidation);
    
    // Validate client exists
    const clientValidation = this.validateClient(formData.clientId, clients);
    errors.push(...clientValidation);
    
    // Validate company exists
    const companyValidation = this.validateCompany(formData.fromCompanyId, companies);
    errors.push(...companyValidation);
    
    // Validate items
    const itemsValidation = this.validateItems(formData.items, products);
    errors.push(...itemsValidation);
    
    // Validate dates
    const dateValidation = this.validateDates(formData.issueDate, formData.dueDate);
    errors.push(...dateValidation);
    
    // Validate tax rate
    const taxValidation = this.validateTaxRate(formData.taxRate);
    errors.push(...taxValidation);
    
    // Business rule: Cannot modify paid invoices significantly
    if (currentInvoice.status === 'paid') {
      const paidInvoiceValidation = this.validatePaidInvoiceModification(formData, currentInvoice);
      errors.push(...paidInvoiceValidation);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate basic invoice information
   */
  static validateBasicInformation(formData: InvoiceFormData): string[] {
    const errors: string[] = [];
    
    if (!formData.invoiceNumber?.trim()) {
      errors.push('Invoice number is required');
    }
    
    if (!formData.clientId) {
      errors.push('Client selection is required');
    }
    
    if (!formData.fromCompanyId) {
      errors.push('Company selection is required');
    }
    
    if (!formData.issueDate) {
      errors.push('Issue date is required');
    }
    
    if (!formData.dueDate) {
      errors.push('Due date is required');
    }
    
    return errors;
  }

  /**
   * Validate invoice number format and uniqueness
   */
  static validateInvoiceNumber(
    invoiceNumber: string,
    existingInvoices: Invoice[],
    excludeId?: string
  ): string[] {
    const errors: string[] = [];
    
    if (!invoiceNumber?.trim()) {
      errors.push('Invoice number is required');
      return errors;
    }
    
    // Check format (basic validation for now)
    if (invoiceNumber.length < 3) {
      errors.push('Invoice number must be at least 3 characters long');
    }
    
    // Check for invalid characters
    if (!/^[a-zA-Z0-9\-_\s]+$/.test(invoiceNumber)) {
      errors.push('Invoice number can only contain letters, numbers, hyphens, underscores, and spaces');
    }
    
    // Check uniqueness
    const isDuplicate = existingInvoices.some(invoice => 
      invoice.invoiceNumber === invoiceNumber && 
      (!excludeId || invoice.id !== excludeId)
    );
    
    if (isDuplicate) {
      errors.push('Invoice number already exists');
    }
    
    return errors;
  }

  /**
   * Validate client selection
   */
  static validateClient(clientId: string, clients: Client[]): string[] {
    const errors: string[] = [];
    
    if (!clientId) {
      errors.push('Client selection is required');
      return errors;
    }
    
    const client = clients.find(c => c.id === clientId);
    if (!client) {
      errors.push('Selected client not found');
    } else if (client.status === 'archived') {
      errors.push('Cannot create invoice for archived client');
    }
    
    return errors;
  }

  /**
   * Validate company selection
   */
  static validateCompany(companyId: number | string | '', companies: Company[]): string[] {
    const errors: string[] = [];
    
    if (!companyId || companyId === '') {
      errors.push('Company selection is required');
      return errors;
    }
    
    // Convert string to number if needed
    const numericCompanyId = typeof companyId === 'string' ? parseInt(companyId) : companyId;
    
    if (isNaN(numericCompanyId)) {
      errors.push('Invalid company selection');
      return errors;
    }
    
    const company = companies.find(c => c.id === numericCompanyId);
    if (!company) {
      errors.push('Selected company not found');
    } else if (company.status !== 'Active') {
      errors.push('Cannot create invoice for inactive company');
    }
    
    return errors;
  }

  /**
   * Validate invoice items
   */
  static validateItems(items: InvoiceFormData['items'], products: Product[]): string[] {
    const errors: string[] = [];
    
    if (!items || items.length === 0) {
      errors.push('At least one item is required');
      return errors;
    }
    
    items.forEach((item, index) => {
      const itemNumber = index + 1;
      
      if (!item.productId) {
        errors.push(`Item ${itemNumber}: Product selection is required`);
        return;
      }
      
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        errors.push(`Item ${itemNumber}: Selected product not found`);
        return;
      }
      
      if (!product.isActive) {
        errors.push(`Item ${itemNumber}: Cannot use inactive product "${product.name}"`);
      }
      
      const quantity = parseFloat(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        errors.push(`Item ${itemNumber}: Quantity must be a positive number`);
      }
      
      if (quantity > 10000) {
        errors.push(`Item ${itemNumber}: Quantity cannot exceed 10,000`);
      }
    });
    
    return errors;
  }

  /**
   * Validate dates
   */
  static validateDates(issueDate: string, dueDate: string): string[] {
    const errors: string[] = [];
    
    if (!issueDate) {
      errors.push('Issue date is required');
    }
    
    if (!dueDate) {
      errors.push('Due date is required');
    }
    
    if (issueDate && dueDate) {
      const issue = new Date(issueDate);
      const due = new Date(dueDate);
      
      if (isNaN(issue.getTime())) {
        errors.push('Issue date is invalid');
      }
      
      if (isNaN(due.getTime())) {
        errors.push('Due date is invalid');
      }
      
      if (!isNaN(issue.getTime()) && !isNaN(due.getTime())) {
        if (due < issue) {
          errors.push('Due date cannot be before issue date');
        }
        
        // Business rule: Due date cannot be more than 1 year in the future
        const oneYearFromIssue = new Date(issue);
        oneYearFromIssue.setFullYear(oneYearFromIssue.getFullYear() + 1);
        
        if (due > oneYearFromIssue) {
          errors.push('Due date cannot be more than 1 year from issue date');
        }
        
        // Warning: Issue date in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (issue > today) {
          console.warn('Issue date is in the future');
        }
      }
    }
    
    return errors;
  }

  /**
   * Validate tax rate
   */
  static validateTaxRate(taxRate: string): string[] {
    const errors: string[] = [];
    
    const rate = parseFloat(taxRate);
    
    if (isNaN(rate)) {
      errors.push('Tax rate must be a valid number');
    } else {
      if (rate < 0) {
        errors.push('Tax rate cannot be negative');
      }
      
      if (rate > 100) {
        errors.push('Tax rate cannot exceed 100%');
      }
    }
    
    return errors;
  }

  /**
   * Validate modifications to paid invoices
   */
  static validatePaidInvoiceModification(
    formData: InvoiceFormData,
    currentInvoice: Invoice
  ): string[] {
    const errors: string[] = [];
    
    // For paid invoices, only allow limited modifications
    if (formData.invoiceNumber !== currentInvoice.invoiceNumber) {
      errors.push('Cannot change invoice number for paid invoices');
    }
    
    if (formData.clientId !== currentInvoice.clientName) {
      errors.push('Cannot change client for paid invoices');
    }
    
    if (formData.fromCompanyId !== currentInvoice.fromCompanyId) {
      errors.push('Cannot change company for paid invoices');
    }
    
    if (formData.issueDate !== currentInvoice.issueDate) {
      errors.push('Cannot change issue date for paid invoices');
    }
    
    // Items validation for paid invoices
    if (formData.items.length !== currentInvoice.items.length) {
      errors.push('Cannot add or remove items from paid invoices');
    } else {
      formData.items.forEach((item, index) => {
        const originalItem = currentInvoice.items[index];
        if (originalItem) {
          if (item.productId !== originalItem.productId) {
            errors.push('Cannot change products in paid invoices');
          }
          
          const newQuantity = parseFloat(item.quantity);
          if (newQuantity !== originalItem.quantity) {
            errors.push('Cannot change quantities in paid invoices');
          }
        }
      });
    }
    
    const newTaxRate = parseFloat(formData.taxRate);
    if (newTaxRate !== currentInvoice.taxRate) {
      errors.push('Cannot change tax rate for paid invoices');
    }
    
    return errors;
  }

  /**
   * Validate payment method assignment
   */
  static validatePaymentMethods(
    paymentMethodIds: string[],
    availablePaymentMethods: unknown[],
    companyId: number
  ): string[] {
    const errors: string[] = [];
    
    if (paymentMethodIds.length === 0) {
      errors.push('At least one payment method is required');
      return errors;
    }
    
    paymentMethodIds.forEach(pmId => {
      const paymentMethod = availablePaymentMethods.find(pm => pm.id === pmId);
      
      if (!paymentMethod) {
        errors.push('Selected payment method not found');
      } else if (paymentMethod.companyId !== companyId) {
        errors.push('Payment method does not belong to selected company');
      }
    });
    
    return errors;
  }

  /**
   * Validate business rules
   */
  static validateBusinessRules(formData: InvoiceFormData, products: Product[]): string[] {
    const errors: string[] = [];
    
    // Business rule: Total amount cannot be zero or negative
    const totalAmount = 0;
    formData.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const quantity = parseFloat(item.quantity) || 0;
        totalAmount += product.price * quantity;
      }
    });
    
    if (totalAmount <= 0) {
      errors.push('Invoice total must be greater than zero');
    }
    
    // Business rule: Cannot have duplicate products in the same invoice
    const productIds = formData.items.map(item => item.productId);
    const uniqueProductIds = new Set(productIds);
    
    if (productIds.length !== uniqueProductIds.size) {
      errors.push('Cannot have duplicate products in the same invoice');
    }
    
    return errors;
  }

  /**
   * Validate field-level input for real-time feedback
   */
  static validateField(
    fieldName: string,
    value: unknown,
    context?: {
      existingInvoices?: Invoice[];
      currentInvoiceId?: string;
      products?: Product[];
      clients?: Client[];
      companies?: Company[];
    }
  ): string | null {
    switch (fieldName) {
      case 'invoiceNumber':
        if (!value?.trim()) {
          return 'Invoice number is required';
        }
        if (value.length < 3) {
          return 'Invoice number must be at least 3 characters';
        }
        if (!/^[a-zA-Z0-9\-_\s]+$/.test(value)) {
          return 'Invalid characters in invoice number';
        }
        if (context?.existingInvoices) {
          const isDuplicate = context.existingInvoices.some(inv => 
            inv.invoiceNumber === value && 
            (!context.currentInvoiceId || inv.id !== context.currentInvoiceId)
          );
          if (isDuplicate) {
            return 'Invoice number already exists';
          }
        }
        break;
        
      case 'clientId':
        if (!value) {
          return 'Client selection is required';
        }
        if (context?.clients) {
          const client = context.clients.find(c => c.id === value);
          if (!client) {
            return 'Selected client not found';
          }
          if (client.status === 'archived') {
            return 'Cannot select archived client';
          }
        }
        break;
        
      case 'fromCompanyId':
        if (!value || value === '') {
          return 'Company selection is required';
        }
        if (context?.companies) {
          const numericValue = typeof value === 'string' ? parseInt(value) : value;
          if (isNaN(numericValue)) {
            return 'Invalid company selection';
          }
          const company = context.companies.find(c => c.id === numericValue);
          if (!company) {
            return 'Selected company not found';
          }
          if (company.status !== 'Active') {
            return 'Cannot select inactive company';
          }
        }
        break;
        
      case 'issueDate':
        if (!value) {
          return 'Issue date is required';
        }
        if (isNaN(new Date(value).getTime())) {
          return 'Invalid issue date';
        }
        break;
        
      case 'dueDate':
        if (!value) {
          return 'Due date is required';
        }
        if (isNaN(new Date(value).getTime())) {
          return 'Invalid due date';
        }
        break;
        
      case 'taxRate':
        const rate = parseFloat(value);
        if (isNaN(rate)) {
          return 'Tax rate must be a number';
        }
        if (rate < 0) {
          return 'Tax rate cannot be negative';
        }
        if (rate > 100) {
          return 'Tax rate cannot exceed 100%';
        }
        break;
        
      case 'quantity':
        const qty = parseFloat(value);
        if (isNaN(qty) || qty <= 0) {
          return 'Quantity must be a positive number';
        }
        if (qty > 10000) {
          return 'Quantity cannot exceed 10,000';
        }
        break;
        
      default:
        return null;
    }
    
    return null;
  }

  /**
   * Validate bulk operations
   */
  static validateBulkOperation(
    invoiceIds: string[],
    operation: 'delete' | 'archive' | 'markPaid' | 'markSent',
    invoices: Invoice[]
  ): ValidationResult {
    const errors: string[] = [];
    
    if (invoiceIds.length === 0) {
      errors.push('No invoices selected');
      return { isValid: false, errors };
    }
    
    invoiceIds.forEach(id => {
      const invoice = invoices.find(inv => inv.id === id);
      
      if (!invoice) {
        errors.push(`Invoice ${id} not found`);
        return;
      }
      
      switch (operation) {
        case 'delete':
          if (invoice.status !== 'archived') {
            errors.push(`Invoice ${invoice.invoiceNumber} must be archived before deletion`);
          }
          break;
          
        case 'archive':
          if (invoice.status === 'archived') {
            errors.push(`Invoice ${invoice.invoiceNumber} is already archived`);
          }
          break;
          
        case 'markPaid':
          if (invoice.status === 'paid') {
            errors.push(`Invoice ${invoice.invoiceNumber} is already paid`);
          }
          if (invoice.status === 'archived') {
            errors.push(`Cannot mark archived invoice ${invoice.invoiceNumber} as paid`);
          }
          break;
          
        case 'markSent':
          if (invoice.status !== 'draft') {
            errors.push(`Only draft invoices can be marked as sent`);
          }
          break;
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}