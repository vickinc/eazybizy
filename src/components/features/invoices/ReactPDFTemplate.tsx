"use client";

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

interface ReactPDFTemplateProps {
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
};

// Create styles with proper margins (1.5cm = ~42.52 points)
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 35,
    paddingLeft: 42.52, // 1.5cm
    paddingRight: 42.52, // 1.5cm
    paddingBottom: 35,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  companyDetails: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.3,
  },
  logo: {
    width: 80,
    height: 60,
    objectFit: 'contain',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333333',
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  billTo: {
    flex: 1,
  },
  billToTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666666',
  },
  billToContent: {
    fontSize: 10,
    lineHeight: 1.2,
  },
  invoiceDetails: {
    width: 200,
    textAlign: 'right',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  detailLabel: {
    fontSize: 9,
    color: '#666666',
    width: 80,
  },
  detailValue: {
    fontSize: 9,
    fontWeight: 'bold',
    width: 100,
    textAlign: 'right',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderBottomWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  tableColNr: { width: '8%', fontSize: 9 },
  tableColDesc: { width: '52%', fontSize: 9 },
  tableColQty: { width: '10%', fontSize: 9, textAlign: 'right' },
  tableColRate: { width: '15%', fontSize: 9, textAlign: 'right' },
  tableColAmount: { width: '15%', fontSize: 9, textAlign: 'right' },
  tableHeaderText: {
    fontWeight: 'bold',
    color: '#333333',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  thankYou: {
    flex: 1,
    fontSize: 9,
    fontStyle: 'italic',
    color: '#666666',
  },
  totals: {
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  totalLabel: {
    fontSize: 9,
    color: '#666666',
  },
  totalValue: {
    fontSize: 9,
  },
  totalDueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#333333',
    paddingTop: 5,
    marginTop: 5,
  },
  totalDueLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalDueValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentInfo: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 3,
    marginBottom: 15,
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  paymentMethod: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  paymentLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    width: 120,
    flexShrink: 0,
  },
  paymentValue: {
    fontSize: 8,
    flex: 1,
  },
  notesSection: {
    marginBottom: 15,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notesContent: {
    fontSize: 9,
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 3,
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 42.52, // Same as page margins
    right: 42.52, // Same as page margins  
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderColor: '#e0e0e0',
    paddingTop: 8,
    fontSize: 8,
    color: '#666666',
  },
});

export function ReactPDFTemplate({ 
  invoice, 
  companyInfo = defaultCompanyInfo, 
  paymentMethods,
  currencyConversions 
}: ReactPDFTemplateProps) {
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

  const formatCurrency = (amount: number) => {
    return `${invoice.currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{companyInfo.name}</Text>
            <View style={styles.companyDetails}>
              {companyInfo.registrationNo && (
                <Text>Registration No: {companyInfo.registrationNo}</Text>
              )}
              {companyInfo.vatNumber ? (
                <Text>VAT Nr: {companyInfo.vatNumber}</Text>
              ) : companyInfo.registrationNo && (
                <Text>VAT Nr: N/A</Text>
              )}
              <Text>{companyInfo.address}</Text>
              <Text>{companyInfo.city}</Text>
              <Text>{companyInfo.zipCode}</Text>
              <Text>{companyInfo.country}</Text>
              <Text>{companyInfo.phone}</Text>
              <Text>{companyInfo.email}</Text>
              <Text>{companyInfo.website}</Text>
            </View>
          </View>
          {companyInfo.logo && (
            <Image style={styles.logo} src={companyInfo.logo} />
          )}
        </View>

        {/* Invoice Title */}
        <Text style={styles.invoiceTitle}>INVOICE</Text>

        {/* Bill To and Invoice Details */}
        <View style={styles.section}>
          <View style={styles.billTo}>
            <Text style={styles.billToTitle}>BILL TO</Text>
            <View style={styles.billToContent}>
              <Text style={{ fontWeight: 'bold' }}>{invoice.clientName}</Text>
              {invoice.clientRegistrationNo && <Text style={{ fontSize: 9, color: '#666666' }}>Registration/Passport No: {invoice.clientRegistrationNo}</Text>}
              {invoice.clientVatNumber && <Text style={{ fontSize: 9, color: '#666666' }}>VAT Nr: {invoice.clientVatNumber}</Text>}
              {!invoice.clientVatNumber && invoice.clientRegistrationNo && <Text style={{ fontSize: 9, color: '#666666' }}>VAT Nr: N/A</Text>}
              {invoice.clientAddress && <Text style={{ fontSize: 9, color: '#666666' }}>{invoice.clientAddress}</Text>}
              <Text style={{ fontSize: 9, color: '#666666' }}>{invoice.clientEmail}</Text>
            </View>
          </View>
          <View style={styles.invoiceDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>INVOICE</Text>
              <Text style={styles.detailValue}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>DATE</Text>
              <Text style={styles.detailValue}>{formatDate(invoice.issueDate)}</Text>
            </View>
            {formatDate(invoice.dueDate) && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>DUE DATE</Text>
                <Text style={styles.detailValue}>{formatDate(invoice.dueDate)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Invoice Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableColNr, styles.tableHeaderText]}>Nr.</Text>
            <Text style={[styles.tableColDesc, styles.tableHeaderText]}>DESCRIPTION</Text>
            <Text style={[styles.tableColQty, styles.tableHeaderText]}>QTY</Text>
            <Text style={[styles.tableColRate, styles.tableHeaderText]}>RATE</Text>
            <Text style={[styles.tableColAmount, styles.tableHeaderText]}>AMOUNT</Text>
          </View>
          
          {/* Table Rows */}
          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableColNr}>{index + 1}</Text>
              <Text style={styles.tableColDesc}>{item.description}</Text>
              <Text style={styles.tableColQty}>{item.quantity}</Text>
              <Text style={styles.tableColRate}>{item.rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              <Text style={styles.tableColAmount}>{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
          ))}
        </View>

        {/* Thank you message and Total Breakdown */}
        <View style={styles.totalSection}>
          <Text style={styles.thankYou}>Thank you for your business!</Text>
          <View style={styles.totals}>
            {/* Subtotal */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
            </View>
            
            {/* Tax (only show if tax rate > 0) */}
            {invoice.taxRate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax ({invoice.taxRate}%):</Text>
                <Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
              </View>
            )}
            
            {/* Total */}
            <View style={styles.totalDueRow}>
              <Text style={styles.totalDueLabel}>TOTAL DUE:</Text>
              <Text style={styles.totalDueValue}>{formatCurrency(total)}</Text>
            </View>
            
            {/* Currency conversions */}
            {currencyConversions && currencyConversions.length > 0 && (
              <View style={{ marginTop: 8 }}>
                {currencyConversions.map((conversion, index) => (
                  <View key={index} style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { fontSize: 8 }]}>
                      Equivalent in {conversion.currency}:
                    </Text>
                    <Text style={[styles.totalValue, { fontWeight: 'bold', fontSize: 9 }]}>
                      {conversion.formattedAmount}
                    </Text>
                  </View>
                ))}
                <Text style={{ fontSize: 7, color: '#999999', marginTop: 4, textAlign: 'right' }}>
                  Exchange rates at time of invoice
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>Payment Information:</Text>
          {paymentMethods && paymentMethods.length > 0 ? (
            <View>
              {paymentMethods.map((method, index) => (
                <View key={index} style={styles.paymentMethod}>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Payment Method: </Text>
                    <Text style={styles.paymentValue}>
                      {method.type === 'bank' ? 'Bank Transfer' : method.name}{method.type !== 'bank' && method.currency && !method.name.includes(`(${method.currency})`) ? ` (${method.currency})` : ''}
                    </Text>
                  </View>
                  {method.accountName && (
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>{method.type === 'bank' ? 'Beneficiary Name: ' : 'Account Name: '}</Text>
                      <Text style={styles.paymentValue}>{method.accountName}</Text>
                    </View>
                  )}
                  {method.type === 'bank' && method.accountName && companyInfo && (
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Beneficiary Address: </Text>
                      <Text style={styles.paymentValue}>
                        {companyInfo.address}{companyInfo.city && `, ${companyInfo.city}`}{companyInfo.zipCode && `, ${companyInfo.zipCode}`}{companyInfo.country && `, ${companyInfo.country}`}
                      </Text>
                    </View>
                  )}
                  {method.bankName && (
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Bank Name: </Text>
                      <Text style={styles.paymentValue}>{method.bankName}</Text>
                    </View>
                  )}
                  {method.bankAddress && (
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Bank Address: </Text>
                      <Text style={styles.paymentValue}>{method.bankAddress}</Text>
                    </View>
                  )}
                  {method.iban && (
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>IBAN{method.currency ? ` (${method.currency})` : ''}: </Text>
                      <Text style={styles.paymentValue}>{method.iban}</Text>
                    </View>
                  )}
                  {method.swiftCode && (
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>SWIFT Code: </Text>
                      <Text style={styles.paymentValue}>{method.swiftCode}</Text>
                    </View>
                  )}
                  {method.accountNumber && (
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Account Number{method.currency ? ` (${method.currency})` : ''}: </Text>
                      <Text style={styles.paymentValue}>{method.accountNumber}</Text>
                    </View>
                  )}
                  {method.sortCode && (
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Sort Code: </Text>
                      <Text style={styles.paymentValue}>{method.sortCode}</Text>
                    </View>
                  )}
                  {method.routingNumber && (
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Routing Number: </Text>
                      <Text style={styles.paymentValue}>{method.routingNumber}</Text>
                    </View>
                  )}
                  {method.walletAddress && (
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Wallet Address: </Text>
                      <Text style={styles.paymentValue}>{method.walletAddress}</Text>
                    </View>
                  )}
                  {method.type === 'bank' && (
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Details: </Text>
                      <Text style={styles.paymentValue}>
                        As a reference to the payment, please write: <Text style={{ fontWeight: 'bold' }}>Invoice Nr. {invoice.invoiceNumber}</Text>
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Beneficiary Name: </Text>
                <Text style={styles.paymentValue}>{defaultCompanyInfo.name}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Beneficiary Address: </Text>
                <Text style={styles.paymentValue}>
                  {companyInfo?.address}{companyInfo?.city && `, ${companyInfo.city}`}{companyInfo?.zipCode && `, ${companyInfo.zipCode}`}{companyInfo?.country && `, ${companyInfo.country}`}
                </Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Bank Name: </Text>
                <Text style={styles.paymentValue}>Business Bank</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Account #: </Text>
                <Text style={styles.paymentValue}>12345678</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Sort Code: </Text>
                <Text style={styles.paymentValue}>12-34-56</Text>
              </View>
            </View>
          )}
        </View>

        {/* Notes Section */}
        {invoice.notes && invoice.notes.trim().length > 0 && (
          <View style={styles.notesSection} wrap={false}>
            <Text style={styles.notesTitle}>Notes</Text>
            <View style={styles.notesContent}>
              <Text style={{ fontSize: 9, lineHeight: 1.5 }}>
                {invoice.notes}
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
        </View>

      </Page>
    </Document>
  );
}

export default ReactPDFTemplate; 