"use client";

import React from 'react';

interface InvoiceTemplateProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    clientName: string;
    clientRegistrationNo?: string;
    clientVatNumber?: string;
    clientEmail: string;
    clientAddress?: string;
    amount: number;
    currency: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'archived';
    dueDate: string;
    issueDate: string;
    description: string;
    template: string;
    taxRate: number;
    notes?: string;
    subtotal?: number;
    taxAmount?: number;
    totalAmount?: number;
    items?: Array<{
      date: string;
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
  };
  companyInfo?: {
    name: string;
    registrationNo?: string;
    vatNumber?: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
    phone: string;
    email: string;
    website: string;
    logo?: string;
  };
  paymentMethods?: Array<{
    id: string;
    type: 'bank' | 'wallet' | 'crypto';
    name: string;
    accountName?: string;
    bankName?: string;
    bankAddress?: string;
    iban?: string;
    swiftCode?: string;
    accountNumber?: string;
    sortCode?: string;
    routingNumber?: string;
    walletAddress?: string;
    qrCode?: string;
    details: string;
    currency?: string;
  }>;
  currencyConversions?: Array<{
    currency: string;
    amount: number;
    formattedAmount: string;
    rate: number;
    paymentMethodNames: string[];
  }>;
  showWatermark?: boolean;
}

const defaultCompanyInfo = {
  name: "Your Company Ltd",
  address: "123 Business Street",
  city: "Business City",
  zipCode: "12345",
  country: "United States",
  phone: "+1 (555) 123-4567",
  email: "billing@yourcompany.com",
  website: "www.yourcompany.com",
  bankName: "Business Bank",
  accountNumber: "12345678",
  sortCode: "12-34-56",
  accountName: "Your Company Ltd"
};

export function InvoiceTemplate({ 
  invoice, 
  companyInfo = defaultCompanyInfo, 
  paymentMethods,
  currencyConversions,
  showWatermark = false 
}: InvoiceTemplateProps) {
  // Calculate subtotal from items if available, otherwise use existing values
  const subtotal = invoice.items && invoice.items.length > 0 
    ? invoice.items.reduce((sum, item) => sum + item.amount, 0)
    : (invoice as any).subtotal || invoice.amount;
  const taxAmount = (invoice as any).taxAmount || ((subtotal * invoice.taxRate) / 100);
  const total = (invoice as any).totalAmount || (subtotal + taxAmount);

  // Create invoice items if not provided
  const items = invoice.items || [
    {
      date: invoice.issueDate,
      description: invoice.description,
      quantity: 1,
      rate: invoice.amount,
      amount: invoice.amount
    }
  ];

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currencyCode?: string) => {
    const effectiveCurrency = currencyCode || invoice.currency || 'USD';
    try {
        return amount.toLocaleString('en-US', {
            style: 'currency',
            currency: effectiveCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    } catch (e) {
        // Fallback for invalid currency codes
        return `${effectiveCurrency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  // The props should now include any pre-converted amounts if needed for display.
  // For example, an `invoice.totalAmountInPaymentCurrency` could be passed.
  // For simplicity, this example assumes the template only shows primary invoice currency.

  return (
    <div className="bg-white shadow-lg min-h-full" style={{ fontFamily: 'Arial, sans-serif', marginLeft: '1.5cm', marginRight: '1.5cm', paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{companyInfo.name}</h1>
          <div className="text-sm text-gray-600 space-y-0.5">
            {companyInfo.registrationNo && (
              <p>Registration No: {companyInfo.registrationNo}</p>
            )}
            {companyInfo.vatNumber ? (
              <p>VAT Nr: {companyInfo.vatNumber}</p>
            ) : companyInfo.registrationNo && (
              <p>VAT Nr: N/A</p>
            )}
            <p>{companyInfo.address}</p>
            <p>{companyInfo.city}</p>
            <p>{companyInfo.zipCode}</p>
            <p>{companyInfo.country}</p>
            <p>{companyInfo.phone}</p>
            <p>{companyInfo.email}</p>
            <p>{companyInfo.website}</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          {companyInfo.logo ? (
            <img src={companyInfo.logo} alt="Company Logo" className="h-20 w-auto" />
          ) : (
            <div className="h-20 w-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">LOGO</span>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Title */}
      <div className="mb-4">
        <h2 className="text-3xl font-bold text-gray-800">INVOICE</h2>
      </div>

      {/* Bill To and Invoice Details */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">BILL TO</h3>
          <div className="text-sm text-gray-600 space-y-0">
            <p className="font-semibold">{invoice.clientName}</p>
            {invoice.clientRegistrationNo && <p className="text-xs text-gray-500">Registration/Passport No: {invoice.clientRegistrationNo}</p>}
            {invoice.clientVatNumber && <p className="text-xs text-gray-500">VAT Nr: {invoice.clientVatNumber}</p>}
            {!invoice.clientVatNumber && invoice.clientRegistrationNo && <p className="text-xs text-gray-500">VAT Nr: N/A</p>}
            {invoice.clientAddress && <p className="text-xs text-gray-500">{invoice.clientAddress}</p>}
            <p className="text-xs text-gray-500">{invoice.clientEmail}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">INVOICE</span>
              <span className="font-semibold">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">DATE</span>
              <span>{formatDate(invoice.issueDate)}</span>
            </div>
            {formatDate(invoice.dueDate) && (
              <div className="flex justify-between">
                <span className="text-gray-600">DUE DATE</span>
                <span>{formatDate(invoice.dueDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Items Table */}
      <div className="mb-6">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-3 font-semibold text-gray-700">Nr.</th>
              <th className="text-left p-3 font-semibold text-gray-700">DESCRIPTION</th>
              <th className="text-right p-3 font-semibold text-gray-700">QTY</th>
              <th className="text-right p-3 font-semibold text-gray-700">RATE</th>
              <th className="text-right p-3 font-semibold text-gray-700">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="p-3 text-sm">{index + 1}</td>
                <td className="p-3 text-sm">{item.description}</td>
                <td className="p-3 text-sm text-right">{item.quantity}</td>
                <td className="p-3 text-sm text-right">{item.rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-3 text-sm text-right">{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Thank you message and Total Breakdown */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <p className="text-sm text-gray-600 italic">Thank you for your business!</p>
        </div>
        <div className="w-64">
          <div className="space-y-1">
            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            
            {/* Tax (only show if tax rate > 0) */}
            {invoice.taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax ({invoice.taxRate}%):</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}
            
            {/* Total */}
            <div className="border-t pt-1 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">TOTAL DUE:</span>
                <div className="text-right">
                  <span className="text-2xl font-bold">{formatCurrency(total, invoice.currency)}</span>
                </div>
              </div>
              {/* Currency conversions for payment methods */}
              {currencyConversions && currencyConversions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {currencyConversions.map((conversion, index) => (
                    <div key={index} className="flex justify-between items-center text-sm text-gray-600">
                      <span>Equivalent in {conversion.currency}:</span>
                      <span className="font-semibold">{conversion.formattedAmount}</span>
                    </div>
                  ))}
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    Exchange rates at time of invoice
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-gray-50 p-4 rounded mb-4">
        <div className="text-sm space-y-2">
          <div className="font-semibold mb-3 text-base">Payment Information:</div>
          {paymentMethods && paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((method, index) => (
                <div key={index} className="mb-3 pb-3 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
                  <div className="space-y-0.5">
                    <div><strong>Payment Method:</strong> {method.type === 'bank' ? 'Bank Transfer' : method.name}{method.type !== 'bank' && method.currency && !method.name.includes(`(${method.currency})`) ? ` (${method.currency})` : ''}</div>
                    {method.accountName && <div><strong>Account Name:</strong> {method.accountName}</div>}
                    {method.bankName && <div><strong>Bank Name:</strong> {method.bankName}</div>}
                    {method.bankAddress && <div><strong>Bank Address:</strong> {method.bankAddress}</div>}
                    {method.iban && <div><strong>IBAN{method.currency ? ` (${method.currency})` : ''}:</strong> {method.iban}</div>}
                    {method.swiftCode && <div><strong>SWIFT Code:</strong> {method.swiftCode}</div>}
                    {method.accountNumber && <div><strong>Account Number{method.currency ? ` (${method.currency})` : ''}:</strong> {method.accountNumber}</div>}
                    {method.sortCode && <div><strong>Sort Code:</strong> {method.sortCode}</div>}
                    {method.routingNumber && <div><strong>Routing Number:</strong> {method.routingNumber}</div>}
                    {method.walletAddress && <div><strong>Wallet Address:</strong> <span className="break-all">{method.walletAddress}</span></div>}
                    {method.type === 'bank' && <div><strong>Details:</strong> As a reference to the payment, please write: <strong>Invoice Nr. {invoice.invoiceNumber}</strong></div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-0.5">
              <div><strong>Account Name:</strong> {defaultCompanyInfo.accountName}</div>
              <div><strong>Bank Name:</strong> {defaultCompanyInfo.bankName}</div>
              <div><strong>Account #:</strong> {defaultCompanyInfo.accountNumber}</div>
              <div><strong>Sort Code:</strong> {defaultCompanyInfo.sortCode}</div>
            </div>
          )}
        </div>
      </div>

      {/* Notes Section */}
      {invoice.notes && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Notes</h3>
          <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
            {invoice.notes}
          </div>
        </div>
      )}

      {/* Watermark */}
      {showWatermark && invoice.status !== 'paid' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="transform rotate-45 text-6xl font-bold text-gray-200 opacity-30">
            {invoice.status.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoiceTemplate; 