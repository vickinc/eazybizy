import { Company } from '@/types';
import { CompanyFormData } from './companyValidationService';
import { isImageLogo as checkIsImageLogo, validateLogo, generateTextLogo as generateLogo } from '@/utils/logoUtils';

export interface FileUploadResult {
  success: boolean;
  dataUrl?: string;
  error?: string;
}

/**
 * Service for company business logic and operations
 */
export class CompanyBusinessService {
  /**
   * Generates a text logo from trading name
   */
  static generateTextLogo(tradingName: string): string {
    return generateLogo(tradingName);
  }

  /**
   * Validates and fixes logo data to ensure it's either a valid image URL or proper text initials
   */
  static validateAndFixLogo(logo: string, tradingName: string): string {
    return validateLogo(logo, tradingName);
  }

  /**
   * Generates a unique ID for a new company
   */
  static generateCompanyId(existingCompanies: Company[]): number {
    if (existingCompanies.length === 0) {
      return 1;
    }
    
    const maxId = Math.max(...existingCompanies.map(c => c.id));
    return maxId + 1;
  }

  /**
   * Creates a new company object from form data
   */
  static createCompanyObject(
    formData: CompanyFormData,
    logoDataUrl: string | null,
    existingCompanies: Company[]
  ): Company {
    const id = this.generateCompanyId(existingCompanies);
    const logo = this.validateAndFixLogo(logoDataUrl || '', formData.tradingName);

    return {
      id,
      legalName: formData.legalName.trim(),
      tradingName: formData.tradingName.trim(),
      registrationNo: formData.registrationNo.trim(),
      vatNumber: formData.vatNumber.trim() || undefined,
      industry: formData.industry.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
      website: this.normalizeWebsiteUrl(formData.website.trim()),
      status: formData.status,
      logo
    };
  }

  /**
   * Updates an existing company object with form data
   */
  static updateCompanyObject(
    existingCompany: Company,
    formData: CompanyFormData,
    logoDataUrl: string | null
  ): Company {
    const logo = this.validateAndFixLogo(logoDataUrl || existingCompany.logo || '', formData.tradingName);

    return {
      ...existingCompany,
      legalName: formData.legalName.trim(),
      tradingName: formData.tradingName.trim(),
      registrationNo: formData.registrationNo.trim(),
      vatNumber: formData.vatNumber.trim() || undefined,
      industry: formData.industry.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
      website: this.normalizeWebsiteUrl(formData.website.trim()),
      status: formData.status,
      logo
    };
  }

  /**
   * Normalizes website URL format
   */
  static normalizeWebsiteUrl(website: string): string {
    if (!website) return '';
    
    // Remove protocol if present for storage
    const withoutProtocol = website.replace(/^https?:\/\//, '');
    
    // Remove trailing slash
    return withoutProtocol.replace(/\/$/, '');
  }

  /**
   * Gets the full website URL with protocol
   */
  static getFullWebsiteUrl(website: string): string {
    if (!website) return '';
    
    // Add https:// if no protocol present
    if (!website.startsWith('http://') && !website.startsWith('https://')) {
      return `https://${website}`;
    }
    
    return website;
  }

  /**
   * Validates and processes logo file upload
   */
  static async processLogoUpload(file: File): Promise<FileUploadResult> {
    // File size validation (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size must be less than 5MB'
      };
    }

    // File type validation
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'File must be an image'
      };
    }

    // Convert to data URL
    try {
      const dataUrl = await this.fileToDataUrl(file);
      return {
        success: true,
        dataUrl
      };
    } catch {
      return {
        success: false,
        error: 'Failed to process image file'
      };
    }
  }

  /**
   * Converts file to data URL
   */
  private static fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result as string;
        resolve(result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Determines if a logo is an image or text
   */
  static isImageLogo(logo: string): boolean {
    return checkIsImageLogo(logo);
  }

  /**
   * Filters companies by status
   */
  static filterCompaniesByStatus(companies: Company[], status: 'Active' | 'Passive' | 'All'): Company[] {
    if (status === 'All') {
      return companies;
    }
    
    return companies.filter(company => company.status === status);
  }

  /**
   * Searches companies by text query
   */
  static searchCompanies(companies: Company[], query: string): Company[] {
    if (!query.trim()) {
      return companies;
    }

    const searchTerm = query.toLowerCase();
    
    return companies.filter(company => 
      company.legalName.toLowerCase().includes(searchTerm) ||
      company.tradingName.toLowerCase().includes(searchTerm) ||
      company.email.toLowerCase().includes(searchTerm) ||
      company.industry.toLowerCase().includes(searchTerm) ||
      company.registrationNo.toLowerCase().includes(searchTerm) ||
      (company.vatNumber && company.vatNumber.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Gets company statistics
   */
  static getCompanyStats(companies: Company[]): {
    total: number;
    active: number;
    passive: number;
    industries: { [key: string]: number };
  } {
    const stats = {
      total: companies.length,
      active: 0,
      passive: 0,
      industries: {} as { [key: string]: number }
    };

    companies.forEach(company => {
      // Count by status
      if (company.status === 'Active') {
        stats.active++;
      } else if (company.status === 'Passive') {
        stats.passive++;
      }

      // Count by industry
      if (company.industry) {
        stats.industries[company.industry] = (stats.industries[company.industry] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Formats companies for display with additional computed fields
   */
  static formatCompaniesForDisplay(companies: Company[]): Company[] {
    return companies.map(company => ({
      ...company,
      // Add any display-specific formatting here if needed
      formattedWebsite: this.normalizeWebsiteUrl(company.website),
      displayLogo: this.isImageLogo(company.logo) ? company.logo : this.generateTextLogo(company.tradingName),
    }));
  }

  /**
   * Validates company data before operations
   */
  static validateCompanyOperation(company: Company): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!company.legalName) {
      errors.push('Legal name is required');
    }

    if (!company.tradingName) {
      errors.push('Trading name is required');
    }

    if (!company.email) {
      errors.push('Email is required');
    }

    if (!['Active', 'Passive'].includes(company.status)) {
      errors.push('Invalid status');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}