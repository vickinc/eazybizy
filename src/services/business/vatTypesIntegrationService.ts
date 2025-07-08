import { VATTreatmentStorageService } from '@/services/storage/vatTreatmentStorageService';
import { VATTreatment } from '@/types/vatTreatment.types';

/**
 * Service to integrate VAT Treatments with Chart of Accounts VAT Types
 * This ensures that custom VAT treatments appear in Chart of Accounts dropdowns
 */
export class VATTypesIntegrationService {
  /**
   * Static VAT types that are always available
   */
  private static readonly STATIC_VAT_TYPES = [
    'Not included in Turnover',
    'Value Added Tax 22%',
    'Value Added Tax 9%',
    'Value Added Tax 0%',
    'Turnover exempt from VAT',
    'VAT on acquisition of non-current assets'
  ];

  /**
   * Get all available VAT types (static + dynamic from VAT treatments)
   * @returns Array of VAT type names
   */
  static getAllVATTypes(): string[] {
    try {
      // Get all VAT treatments
      const treatments = VATTreatmentStorageService.getAll();
      
      // Extract active treatment names
      const treatmentNames = treatments
        .filter((treatment: VATTreatment) => treatment.isActive)
        .map((treatment: VATTreatment) => treatment.name);

      // Combine static types with treatment names, removing duplicates
      const allTypes = [...this.STATIC_VAT_TYPES, ...treatmentNames];
      const uniqueTypes = Array.from(new Set(allTypes));

      // Sort alphabetically for better UX
      return uniqueTypes.sort();
    } catch (error) {
      console.error('Error getting VAT types:', error);
      // Fallback to static types only
      return this.STATIC_VAT_TYPES;
    }
  }

  /**
   * Get a specific VAT treatment by name
   * @param name VAT treatment name
   * @returns VAT treatment or null if not found
   */
  static getVATTreatmentByName(name: string): VATTreatment | null {
    try {
      const treatments = VATTreatmentStorageService.getAll();
      return treatments.find((treatment: VATTreatment) => treatment.name === name) || null;
    } catch (error) {
      console.error('Error getting VAT treatment by name:', error);
      return null;
    }
  }

  /**
   * Check if a VAT type is a custom treatment (not static)
   * @param vatType VAT type name
   * @returns True if it's a custom treatment
   */
  static isCustomVATTreatment(vatType: string): boolean {
    return !this.STATIC_VAT_TYPES.includes(vatType);
  }

  /**
   * Get VAT rate from VAT type name
   * @param vatType VAT type name
   * @returns VAT rate as number or null if not found
   */
  static getVATRateFromType(vatType: string): number | null {
    // Handle static types with known rates
    if (vatType.includes('22%')) return 22;
    if (vatType.includes('9%')) return 9;
    if (vatType.includes('0%')) return 0;

    // Handle custom treatments
    const treatment = this.getVATTreatmentByName(vatType);
    return treatment ? treatment.rate : null;
  }

  /**
   * Get formatted VAT type display with rate
   * @param vatType VAT type name
   * @returns Formatted string with rate information
   */
  static getFormattedVATType(vatType: string): string {
    const rate = this.getVATRateFromType(vatType);
    
    if (rate !== null && rate > 0) {
      // Only add rate if it's not already in the name
      if (!vatType.includes('%')) {
        return `${vatType} (${rate}%)`;
      }
    }
    
    return vatType;
  }

  /**
   * Get description for VAT type
   * @param vatType VAT type name
   * @returns Description string
   */
  static getVATTypeDescription(vatType: string): string {
    // Static type descriptions
    const staticDescriptions: Record<string, string> = {
      'Not included in Turnover': 'Transactions not subject to VAT',
      'Value Added Tax 22%': 'Standard VAT rate',
      'Value Added Tax 9%': 'Reduced VAT rate',
      'Value Added Tax 0%': 'Zero-rated VAT',
      'Turnover exempt from VAT': 'VAT-exempt transactions',
      'VAT on acquisition of non-current assets': 'Asset acquisition VAT treatment'
    };

    // Check static descriptions first
    if (staticDescriptions[vatType]) {
      return staticDescriptions[vatType];
    }

    // Get description from custom treatment
    const treatment = this.getVATTreatmentByName(vatType);
    if (treatment) {
      return treatment.description;
    }

    return 'Custom VAT treatment';
  }
}