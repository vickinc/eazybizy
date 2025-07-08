import { Vendor } from '@/types/vendor.types';

export class VendorStorageService {
  private static readonly STORAGE_KEY = 'app-vendors';

  static getVendors(): Vendor[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const savedVendors = localStorage.getItem(this.STORAGE_KEY);
      if (!savedVendors) return [];
      
      const parsedVendors = JSON.parse(savedVendors);
      
      // Ensure all vendors have required fields for backward compatibility
      return parsedVendors.map((vendor: any) => ({
        ...vendor,
        phone: vendor.phone || '',
        companyName: vendor.companyName || '',
        contactPerson: vendor.contactPerson || '',
        contactEmail: vendor.contactEmail || '',
        website: vendor.website || '',
        currency: vendor.currency || 'USD',
        paymentMethod: vendor.paymentMethod || 'Bank',
        billingAddress: vendor.billingAddress || '',
        itemsServicesSold: vendor.itemsServicesSold || '',
        notes: vendor.notes || '',
        companyRegistrationNr: vendor.companyRegistrationNr || '',
        vatNr: vendor.vatNr || '',
        vendorCountry: vendor.vendorCountry || ''
      }));
    } catch (error) {
      console.error('Failed to parse saved vendors:', error);
      return [];
    }
  }

  static saveVendors(vendors: Vendor[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(vendors));
      console.log('Vendors saved to localStorage:', vendors.length, 'vendors');
    } catch (error) {
      console.error('Failed to save vendors to localStorage:', error);
    }
  }

  static addVendor(vendor: Vendor): Vendor[] {
    const vendors = this.getVendors();
    const updatedVendors = [vendor, ...vendors];
    this.saveVendors(updatedVendors);
    return updatedVendors;
  }

  static updateVendor(updatedVendor: Vendor): Vendor[] {
    const vendors = this.getVendors();
    const updatedVendors = vendors.map(vendor => 
      vendor.id === updatedVendor.id ? updatedVendor : vendor
    );
    this.saveVendors(updatedVendors);
    return updatedVendors;
  }

  static deleteVendor(vendorId: string): Vendor[] {
    const vendors = this.getVendors();
    const updatedVendors = vendors.filter(vendor => vendor.id !== vendorId);
    this.saveVendors(updatedVendors);
    return updatedVendors;
  }

  static toggleVendorStatus(vendorId: string): Vendor[] {
    const vendors = this.getVendors();
    const updatedVendors = vendors.map(vendor =>
      vendor.id === vendorId
        ? { ...vendor, isActive: !vendor.isActive }
        : vendor
    );
    this.saveVendors(updatedVendors);
    return updatedVendors;
  }
}