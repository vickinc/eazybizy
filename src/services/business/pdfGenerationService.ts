import * as React from 'react';
import { pdf } from '@react-pdf/renderer';
import { Company } from '@/types/company.types';
import { CompanyReactPDFTemplate } from '@/components/features/companies/CompanyReactPDFTemplate';

export interface CompanyPDFOptions {
  includeRepresentatives?: boolean;
  includeShareholders?: boolean;
  includeContactPerson?: boolean;
}

export class PDFGenerationService {
  static async generateCompanyPDF(
    company: Company, 
    options: CompanyPDFOptions = {
      includeRepresentatives: true,
      includeShareholders: false,
      includeContactPerson: true
    }
  ): Promise<void> {
    try {
      // Create the PDF document using CompanyReactPDFTemplate
      const doc = React.createElement(CompanyReactPDFTemplate, {
        company,
        includeRepresentatives: options.includeRepresentatives,
        includeShareholders: options.includeShareholders,
        includeContactPerson: options.includeContactPerson,
      });

      // Generate PDF blob
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      
      // Create filename from company name
      const fileName = `${company.tradingName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_profile.pdf`;
      
      // Download the PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate company PDF');
    }
  }
}