import React, { useMemo, useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { InvoiceBusinessService } from "@/services/business/invoiceBusinessService";

interface Company {
  id: string;
  tradingName: string;
  address: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  name: string;
  accountName?: string;
  bankName?: string;
  bankAddress?: string;
  iban?: string;
  swiftCode?: string;
  currency?: string;
}

interface InvoicePreviewDialogProps {
  invoice: unknown | null;
  companies: Company[];
  paymentMethods: PaymentMethod[];
  onClose: () => void;
}

export const InvoicePreviewDialog: React.FC<InvoicePreviewDialogProps> = ({
  invoice,
  companies,
  paymentMethods,
  onClose,
}) => {
  const [invoicePaymentMethods, setInvoicePaymentMethods] = useState<PaymentMethod[]>([]);
  
  // Fallback method to fetch specific payment methods by their IDs
  const fetchPaymentMethodsFallback = useCallback(async (selectedIds?: string[]) => {
    if (!invoice?.fromCompanyId) {
      setInvoicePaymentMethods([]);
      return;
    }
    
    try {
      // Fetch both bank accounts and digital wallets for this specific company
      const [bankAccountsRes, digitalWalletsRes] = await Promise.all([
        fetch(`/api/bank-accounts?companyId=${invoice.fromCompanyId}`),
        fetch(`/api/digital-wallets?companyId=${invoice.fromCompanyId}`)
      ]);
      
      const bankAccounts = bankAccountsRes.ok ? await bankAccountsRes.json() : { data: [] };
      const digitalWallets = digitalWalletsRes.ok ? await digitalWalletsRes.json() : { data: [] };
      
      // Transform to payment method format
      const allMethods = [
        ...(bankAccounts.data || []).filter((bank: unknown) => bank.isActive).map((bank: unknown) => ({
          id: bank.id,
          type: 'BANK',
          name: bank.bankName,
          accountName: bank.accountName,
          bankName: bank.bankName,
          bankAddress: bank.bankAddress,
          iban: bank.iban,
          swiftCode: bank.swiftCode,
          accountNumber: bank.accountNumber,
          currency: bank.currency,
          details: bank.notes || ''
        })),
        ...(digitalWallets.data || []).filter((wallet: unknown) => wallet.isActive).map((wallet: unknown) => ({
          id: wallet.id,
          type: 'WALLET',
          name: wallet.walletName,
          walletAddress: wallet.walletAddress,
          currency: wallet.currency,
          details: wallet.description || ''
        }))
      ];
      
      // Filter to only selected payment methods if IDs are provided
      const filteredMethods = selectedIds && selectedIds.length > 0 
        ? allMethods.filter(method => selectedIds.includes(method.id))
        : allMethods;
      setInvoicePaymentMethods(filteredMethods);
    } catch (error) {
      console.error('Error fetching payment methods for preview:', error);
      setInvoicePaymentMethods([]);
    }
  }, [invoice]);
  
  // Extract payment methods from invoice data
  useEffect(() => {
    if (!invoice) {
      setInvoicePaymentMethods([]);
      return;
    }
    
    
    // If invoice has paymentMethodInvoices relation with valid data, use that
    if (invoice.paymentMethodInvoices && invoice.paymentMethodInvoices.length > 0) {
      // Check if the payment method data is complete
      const validMethods = invoice.paymentMethodInvoices.filter((pmi: unknown) => 
        pmi.paymentMethod && (pmi.paymentMethod.name || pmi.paymentMethod.bankName)
      );
      
      if (validMethods.length > 0) {
        const methods = validMethods.map((pmi: unknown) => ({
          id: pmi.paymentMethod.id,
          type: pmi.paymentMethod.type,
          name: pmi.paymentMethod.name,
          accountName: pmi.paymentMethod.accountName,
          bankName: pmi.paymentMethod.bankName,
          bankAddress: pmi.paymentMethod.bankAddress,
          iban: pmi.paymentMethod.iban,
          swiftCode: pmi.paymentMethod.swiftCode,
          accountNumber: pmi.paymentMethod.accountNumber,
          walletAddress: pmi.paymentMethod.walletAddress,
          currency: pmi.paymentMethod.currency,
          details: pmi.paymentMethod.details || ''
        }));
        
        setInvoicePaymentMethods(methods);
      } else {
        // If payment method data is incomplete, get the selected IDs and use fallback
        const selectedIds = invoice.paymentMethodInvoices?.map((pmi: unknown) => pmi.paymentMethodId) || [];
        fetchPaymentMethodsFallback(selectedIds);
      }
    } else {
      // Use PaymentMethodInvoice relationship
      const selectedIds = invoice.paymentMethodInvoices?.map((pmi: unknown) => pmi.paymentMethodId) || [];
      fetchPaymentMethodsFallback(selectedIds);
    }
  }, [invoice, fetchPaymentMethodsFallback]);
  
  // Calculate currency conversions for payment methods
  const currencyConversions = useMemo(() => {
    if (!invoice || !invoicePaymentMethods || invoicePaymentMethods.length === 0) return [];
    
    try {
      const rates = InvoiceBusinessService.getExchangeRates();
      
      // Calculate conversions for all available payment methods with different currencies
      const currencyGroups = new Map<string, { methods: unknown[]; names: string[] }>();
      
      invoicePaymentMethods.forEach(method => {
        const currency = method.currency;
        if (!currency || currency === invoice.currency) {
          return;
        }
        
        if (!currencyGroups.has(currency)) {
          currencyGroups.set(currency, { methods: [], names: [] });
        }
        
        const group = currencyGroups.get(currency)!;
        group.methods.push(method);
        group.names.push(method.name || `${method.bankName} (${method.accountName})`);
      });
      
      const conversions: Array<{
        currency: string;
        amount: number;
        formattedAmount: string;
        rate: number;
        paymentMethodNames: string[];
      }> = [];
      
      currencyGroups.forEach((group, currency) => {
        const convertedAmount = InvoiceBusinessService.convertCurrency(
          invoice.totalAmount || 0,
          invoice.currency,
          currency,
          rates
        );
        
        const rate = (invoice.totalAmount || 0) > 0 ? convertedAmount / (invoice.totalAmount || 0) : 0;
        
        // Handle crypto/non-standard currencies that aren't supported by Intl.NumberFormat
        let formatter;
        try {
          formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
        } catch (error) {
          // Fallback for non-standard currencies like USDT, BTC, etc.
          formatter = new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
        }
        
        conversions.push({
          currency,
          amount: convertedAmount,
          formattedAmount: formatter.format ? 
            formatter.format(convertedAmount) : 
            `${convertedAmount.toFixed(2)} ${currency}`,
          rate: rate,
          paymentMethodNames: group.names
        });
      });
      
      return conversions;
    } catch (error) {
      console.warn('Error calculating currency conversions:', error);
      return [];
    }
  }, [invoice, invoicePaymentMethods]);

  if (!invoice) return null;

  return (
    <Dialog open={!!invoice} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Preview - {invoice.invoiceNumber}</DialogTitle>
          <DialogDescription>
            Preview of invoice for {invoice.clientName}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-1">
          {/* Compact Invoice Preview */}
          <div className="bg-white border rounded-lg p-6 max-w-full">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                {(() => {
                  const company = companies.find(c => Number(c.id) === Number(invoice.fromCompanyId));
                  return company && (
                    <div className="mb-2">
                      <h2 className="text-lg font-bold text-gray-900">
                        {company.tradingName}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {company.address}
                      </p>
                    </div>
                  );
                })()}
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
                <p className="text-sm text-gray-600">#{invoice.invoiceNumber}</p>
              </div>
            </div>

            {/* Client and Dates */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Bill To:</h3>
                <div className="text-sm">
                  <p className="font-medium">{invoice.clientName}</p>
                  <p className="text-gray-600">{invoice.clientEmail}</p>
                  {invoice.clientAddress && (
                    <p className="text-gray-600">{invoice.clientAddress}</p>
                  )}
                </div>
              </div>
              <div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Issue Date:</span>
                    <span>{new Date(invoice.issueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={`text-xs ${invoice.statusConfig ? `${invoice.statusConfig.color} ${invoice.statusConfig.bgColor}` : 'bg-gray-100 text-gray-800'}`}>
                      {invoice.statusConfig ? invoice.statusConfig.label : (invoice.status || 'Unknown').charAt(0).toUpperCase() + (invoice.status || 'Unknown').slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 text-gray-700">Description</th>
                    <th className="text-right py-2 text-gray-700">Qty</th>
                    <th className="text-right py-2 text-gray-700">Rate</th>
                    <th className="text-right py-2 text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((item: unknown, index: number) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          {item.description && (
                            <p className="text-gray-600 text-xs">{item.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="text-right py-2">{item.quantity || 0}</td>
                      <td className="text-right py-2">{invoice.currency} {(item.unitPrice || 0).toLocaleString()}</td>
                      <td className="text-right py-2">{invoice.currency} {(item.total || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{invoice.currency} {(invoice.subtotal || 0).toLocaleString()}</span>
                </div>
                {(invoice.taxRate || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({invoice.taxRate || 0}%):</span>
                    <span>{invoice.currency} {(invoice.taxAmount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Total:</span>
                  <span>{invoice.currency} {(invoice.totalAmount || 0).toLocaleString()}</span>
                </div>
                {/* Currency conversions */}
                {(currencyConversions || []).length > 0 && (
                  <div className="mt-2 space-y-1 border-t pt-2">
                    {(currencyConversions || []).map((conversion, index) => (
                      <div key={index} className="flex justify-between text-sm text-gray-600">
                        <span>Equivalent in {conversion.currency}:</span>
                        <span className="font-medium">{conversion.formattedAmount}</span>
                      </div>
                    ))}
                    <div className="text-xs text-gray-500 text-right mt-1">
                      Exchange rates at time of invoice
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            {invoicePaymentMethods.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment Information:</h4>
                {invoicePaymentMethods.map((method, index) => (
                  <div key={index} className="mb-4 last:mb-0">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium text-gray-600">Payment Method:</div>
                      <div>{method.type === 'BANK' ? 'Bank Transfer' : method.name}</div>
                      
                      {method.accountName && (
                        <>
                          <div className="font-medium text-gray-600">Account Name:</div>
                          <div>{method.accountName}</div>
                        </>
                      )}
                      
                      {method.bankName && (
                        <>
                          <div className="font-medium text-gray-600">Bank Name:</div>
                          <div>{method.bankName}</div>
                        </>
                      )}
                      
                      {method.bankAddress && (
                        <>
                          <div className="font-medium text-gray-600">Bank Address:</div>
                          <div>{method.bankAddress}</div>
                        </>
                      )}
                      
                      {method.iban && (
                        <>
                          <div className="font-medium text-gray-600">IBAN {method.currency ? `(${method.currency})` : ''}:</div>
                          <div className="font-mono text-xs">{method.iban}</div>
                        </>
                      )}
                      
                      {method.swiftCode && (
                        <>
                          <div className="font-medium text-gray-600">SWIFT Code:</div>
                          <div>{method.swiftCode}</div>
                        </>
                      )}
                    </div>
                    
                    {method.type === 'BANK' && (
                      <div className="mt-2 p-2 bg-white rounded border text-xs">
                        <span className="font-medium text-gray-600">Payment Reference:</span>
                        <span className="ml-1">Invoice Nr. {invoice.invoiceNumber}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {invoice.notes && invoice.notes.trim().length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes:</h4>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};