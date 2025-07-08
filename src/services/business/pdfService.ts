import * as React from 'react';
import { pdf } from '@react-pdf/renderer';
import { ReactPDFTemplate } from '@/components/features/invoices';
import { InvoiceBusinessService } from '@/services/business/invoiceBusinessService';

export class PDFService {
  static async generateInvoicePDF(
    invoice: any, 
    company: any, 
    paymentMethods: any[] = [], 
    clients: any[] = []
  ): Promise<void> {
    try {
      // Get company info
      const companyInfo = company ? {
        name: company.legalName || company.tradingName,
        registrationNo: company.registrationNo,
        vatNumber: company.vatNumber,
        address: company.address,
        city: '',
        zipCode: '',
        country: '',
        phone: company.phone,
        email: company.email,
        website: company.website,
        logo: company.logo
      } : undefined;

      // Get payment methods for this invoice
      let invoicePaymentMethods = paymentMethods.length > 0 ? [paymentMethods[0]] : [];
      
      invoicePaymentMethods = invoicePaymentMethods.map(pm => ({
        id: pm.id,
        type: (pm.type || 'BANK').toLowerCase() as 'bank' | 'wallet' | 'crypto',
        name: pm.name,
        accountName: pm.accountName,
        bankName: pm.bankName,
        bankAddress: pm.bankAddress,
        iban: pm.iban,
        swiftCode: pm.swiftCode,
        accountNumber: pm.accountNumber || '',
        sortCode: '',
        routingNumber: '',
        walletAddress: pm.walletAddress,
        qrCode: '',
        details: pm.details,
        currency: pm.currency
      }));

      // Get client info
      const client = clients.find(c => c.name === invoice.clientName && c.email === invoice.clientEmail);
      const clientRegistrationNo = client?.clientType === 'Legal Entity' 
        ? client.registrationNumber 
        : client?.passportNumber;
      const clientVatNumber = client?.clientType === 'Legal Entity' ? client?.vatNumber : undefined;

      // Get exchange rates and calculate currency conversions
      const exchangeRates = InvoiceBusinessService.getExchangeRates();
      console.log('Exchange rates:', exchangeRates);
      console.log('Invoice currency:', invoice.currency);
      console.log('Invoice total amount:', invoice.totalAmount);
      console.log('Payment methods currencies:', invoicePaymentMethods.map(pm => ({ name: pm.name, currency: pm.currency })));
      
      // Calculate currency conversions for all payment methods with different currencies
      const currencyConversions: Array<{
        currency: string;
        amount: number;
        formattedAmount: string;
        rate: number;
        paymentMethodNames: string[];
      }> = [];
      
      // Group payment methods by currency
      const currencyGroups = new Map<string, { methods: any[]; names: string[] }>();
      
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
      currencyGroups.forEach((group, currency) => {
        const convertedAmount = InvoiceBusinessService.convertCurrency(
          invoice.totalAmount || 0,
          invoice.currency,
          currency,
          exchangeRates
        );
        
        // Calculate the effective rate
        const rate = (invoice.totalAmount || 0) > 0 ? convertedAmount / (invoice.totalAmount || 0) : 0;
        
        // Format the converted amount
        const formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        
        currencyConversions.push({
          currency,
          amount: convertedAmount,
          formattedAmount: formatter.format(convertedAmount),
          rate: rate,
          paymentMethodNames: group.names
        });
      });
      
      console.log('Final currency conversions:', currencyConversions);

      // Create the PDF document using ReactPDFTemplate
      const doc = React.createElement(ReactPDFTemplate, {
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientName,
          clientRegistrationNo: clientRegistrationNo,
          clientVatNumber: clientVatNumber,
          clientEmail: invoice.clientEmail,
          clientAddress: invoice.clientAddress,
          amount: invoice.totalAmount || 0,
          currency: invoice.currency,
          status: invoice.status,
          dueDate: invoice.dueDate,
          issueDate: invoice.issueDate,
          description: '', // Legacy field
          template: invoice.template,
          taxRate: invoice.taxRate,
          notes: invoice.notes,
          subtotal: invoice.subtotal,
          taxAmount: invoice.taxAmount,
          totalAmount: invoice.totalAmount,
          items: invoice.items?.map((item: any) => ({
            date: invoice.issueDate,
            description: `${item.productName}${item.description ? ` - ${item.description}` : ''}`,
            quantity: item.quantity,
            rate: item.unitPrice,
            amount: item.total
          })) || []
        },
        companyInfo,
        paymentMethods: invoicePaymentMethods,
        currencyConversions
      });

      // Generate PDF blob
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      
      // Download the PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
}