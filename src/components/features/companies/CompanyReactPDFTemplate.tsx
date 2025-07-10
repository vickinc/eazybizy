"use client";

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Link } from '@react-pdf/renderer';
import { Company } from '@/types/company.types';

// Define styles for the PDF document
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  logo: {
    width: 80,
    height: 80,
    marginRight: 20,
  },
  companyHeader: {
    flex: 1,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  industry: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  status: {
    fontSize: 10,
    color: '#059669',
    backgroundColor: '#D1FAE5',
    padding: '4 8',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: 140,
    fontSize: 10,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: '#1F2937',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: '#1F2937',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  socialMedia: {
    flexDirection: 'column',
    marginTop: 5,
  },
  socialLink: {
    fontSize: 9,
    color: '#3B82F6',
    textDecoration: 'none',
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  socialLabel: {
    fontSize: 9,
    color: '#000000',
    fontWeight: 'bold',
    width: 80,
  },
  icon: {
    width: 12,
    height: 12,
    marginRight: 4,
  },
});

interface CompanyReactPDFTemplateProps {
  company: Company;
  includeRepresentatives?: boolean;
  includeShareholders?: boolean;
  includeContactPerson?: boolean;
}

export const CompanyReactPDFTemplate: React.FC<CompanyReactPDFTemplateProps> = ({
  company,
  includeRepresentatives = true,
  includeShareholders = true,
  includeContactPerson = true,
}) => {
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB');
  };

  const isImageLogo = (logo: string) => {
    if (!logo) return false;
    return logo.startsWith('http') || logo.startsWith('data:image') || logo.includes('.');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          {isImageLogo(company.logo) && (
            <Image src={company.logo} style={styles.logo} />
          )}
          <View style={styles.companyHeader}>
            <Text style={styles.companyName}>{company.tradingName}</Text>
            <Text style={styles.industry}>{company.industry}</Text>
            <View style={styles.status}>
              <Text>{company.status}</Text>
            </View>
          </View>
        </View>

        {/* Company Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Legal Name:</Text>
            <Text style={styles.value}>{company.legalName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Trading Name:</Text>
            <Text style={styles.value}>{company.tradingName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Registration No:</Text>
            <Text style={styles.value}>{company.registrationNo}</Text>
          </View>
          {company.registrationDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Registration Date:</Text>
              <Text style={styles.value}>{formatDate(company.registrationDate)}</Text>
            </View>
          )}
          {company.countryOfRegistration && (
            <View style={styles.row}>
              <Text style={styles.label}>Country:</Text>
              <Text style={styles.value}>{company.countryOfRegistration}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Industry:</Text>
            <Text style={styles.value}>{company.industry}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{company.status}</Text>
          </View>
        </View>

        {/* Business Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Details</Text>
          {company.baseCurrency && (
            <View style={styles.row}>
              <Text style={styles.label}>Base Currency:</Text>
              <Text style={styles.value}>{company.baseCurrency}</Text>
            </View>
          )}
          {company.businessLicenseNr && (
            <View style={styles.row}>
              <Text style={styles.label}>Business License:</Text>
              <Text style={styles.value}>{company.businessLicenseNr}</Text>
            </View>
          )}
          {company.vatNumber && (
            <View style={styles.row}>
              <Text style={styles.label}>VAT Number:</Text>
              <Text style={styles.value}>{company.vatNumber}</Text>
            </View>
          )}
        </View>

        {/* Contact Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          {company.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{company.address}</Text>
            </View>
          )}
          {company.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{company.phone}</Text>
            </View>
          )}
          {company.email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{company.email}</Text>
            </View>
          )}
          {company.website && (
            <View style={styles.row}>
              <Text style={styles.label}>Website:</Text>
              <Text style={styles.value}>{company.website}</Text>
            </View>
          )}
          
          {/* Social Media Links */}
          {(company.facebookUrl || company.instagramUrl || company.xUrl || company.youtubeUrl) && (
            <View style={styles.section}>
              <Text style={styles.label}>Social Media:</Text>
              <View style={styles.socialMedia}>
                {company.facebookUrl && (
                  <View style={styles.socialItem}>
                    <Text style={styles.socialLabel}>Facebook:</Text>
                    <Link 
                      src={company.facebookUrl.startsWith('http') ? company.facebookUrl : `https://${company.facebookUrl}`}
                      style={styles.socialLink}
                    >
                      {company.facebookUrl}
                    </Link>
                  </View>
                )}
                {company.instagramUrl && (
                  <View style={styles.socialItem}>
                    <Text style={styles.socialLabel}>Instagram:</Text>
                    <Link 
                      src={company.instagramUrl.startsWith('http') ? company.instagramUrl : `https://${company.instagramUrl}`}
                      style={styles.socialLink}
                    >
                      {company.instagramUrl}
                    </Link>
                  </View>
                )}
                {company.xUrl && (
                  <View style={styles.socialItem}>
                    <Text style={styles.socialLabel}>X (Twitter):</Text>
                    <Link 
                      src={company.xUrl.startsWith('http') ? company.xUrl : `https://${company.xUrl}`}
                      style={styles.socialLink}
                    >
                      {company.xUrl}
                    </Link>
                  </View>
                )}
                {company.youtubeUrl && (
                  <View style={styles.socialItem}>
                    <Text style={styles.socialLabel}>YouTube:</Text>
                    <Link 
                      src={company.youtubeUrl.startsWith('http') ? company.youtubeUrl : `https://${company.youtubeUrl}`}
                      style={styles.socialLink}
                    >
                      {company.youtubeUrl}
                    </Link>
                  </View>
                )}
              </View>
            </View>
          )}
          
          {/* Messaging Platforms */}
          {(company.whatsappNumber || company.telegramNumber) && (
            <View style={styles.section}>
              <Text style={styles.label}>Messaging:</Text>
              <View style={styles.socialMedia}>
                {company.whatsappNumber && (
                  <View style={styles.socialItem}>
                    <Text style={styles.socialLabel}>WhatsApp:</Text>
                    <Link 
                      src={`https://wa.me/${company.whatsappNumber}`}
                      style={styles.socialLink}
                    >
                      {company.whatsappNumber}
                    </Link>
                  </View>
                )}
                {company.telegramNumber && (
                  <View style={styles.socialItem}>
                    <Text style={styles.socialLabel}>Telegram:</Text>
                    <Link 
                      src={company.telegramNumber.startsWith('http') ? company.telegramNumber : `https://t.me/${company.telegramNumber}`}
                      style={styles.socialLink}
                    >
                      {company.telegramNumber}
                    </Link>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Contact Person Section */}
        {includeContactPerson && (company.mainContactEmail || company.mainContactType) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Person</Text>
            {(() => {
              // Try to find the main contact person from representatives or shareholders
              let contactPerson = null;
              
              if (company.mainContactEmail && company.mainContactType) {
                if (company.mainContactType === 'representative' && company.representatives) {
                  contactPerson = company.representatives.find(rep => rep.email === company.mainContactEmail);
                } else if (company.mainContactType === 'shareholder' && company.shareholders) {
                  contactPerson = company.shareholders.find(sh => sh.email === company.mainContactEmail);
                }
              }
              
              if (contactPerson) {
                return (
                  <>
                    <View style={styles.row}>
                      <Text style={styles.label}>Name:</Text>
                      <Text style={styles.value}>{contactPerson.firstName} {contactPerson.lastName}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Email:</Text>
                      <Text style={styles.value}>{contactPerson.email}</Text>
                    </View>
                    {contactPerson.phoneNumber && (
                      <View style={styles.row}>
                        <Text style={styles.label}>Phone:</Text>
                        <Text style={styles.value}>{contactPerson.phoneNumber}</Text>
                      </View>
                    )}
                    <View style={styles.row}>
                      <Text style={styles.label}>Role:</Text>
                      <Text style={styles.value}>
                        {company.mainContactType === 'representative' 
                          ? ((contactPerson as any).role === 'Other' ? (contactPerson as any).customRole || 'Other' : (contactPerson as any).role)
                          : 'Shareholder'
                        }
                      </Text>
                    </View>
                  </>
                );
              } else if (company.mainContactEmail && company.mainContactType) {
                return (
                  <>
                    <View style={styles.row}>
                      <Text style={styles.label}>Contact Email:</Text>
                      <Text style={styles.value}>{company.mainContactEmail}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Contact Type:</Text>
                      <Text style={styles.value}>{company.mainContactType}</Text>
                    </View>
                  </>
                );
              } else {
                return (
                  <View style={styles.row}>
                    <Text style={styles.value}>No specific contact person designated during onboarding</Text>
                  </View>
                );
              }
            })()}
          </View>
        )}

        {/* Representatives Section */}
        {includeRepresentatives && company.representatives && company.representatives.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company Representatives</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Name</Text>
                <Text style={styles.tableHeaderCell}>Role</Text>
                <Text style={styles.tableHeaderCell}>Email</Text>
                <Text style={styles.tableHeaderCell}>Phone</Text>
              </View>
              {company.representatives.map((rep, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{rep.firstName} {rep.lastName}</Text>
                  <Text style={styles.tableCell}>{rep.role === 'Other' ? rep.customRole || 'Other' : rep.role}</Text>
                  <Text style={styles.tableCell}>{rep.email}</Text>
                  <Text style={styles.tableCell}>{rep.phoneNumber || 'N/A'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Shareholders Section */}
        {includeShareholders && company.shareholders && company.shareholders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shareholders</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Name</Text>
                <Text style={styles.tableHeaderCell}>Type</Text>
                <Text style={styles.tableHeaderCell}>Ownership %</Text>
                <Text style={styles.tableHeaderCell}>Contact</Text>
              </View>
              {company.shareholders.map((shareholder, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{shareholder.firstName} {shareholder.lastName}</Text>
                  <Text style={styles.tableCell}>Individual</Text>
                  <Text style={styles.tableCell}>{shareholder.ownershipPercent}%</Text>
                  <Text style={styles.tableCell}>{shareholder.email || 'N/A'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated on {new Date().toLocaleDateString('en-GB')} • Company Profile Document
        </Text>
      </Page>
    </Document>
  );
};