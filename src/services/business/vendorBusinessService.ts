import { Vendor, FormattedVendor, VendorFilters, VendorStatistics, NewVendor } from '@/types/vendor.types';
import { Company } from '@/types/company.types';
import { Product } from '@/types/products.types';
import { getLocalDateTimeString, formatDateForDisplay } from '@/utils';

export class VendorBusinessService {
  static formatVendorForDisplay(
    vendor: Vendor,
    companies: Company[],
    products: Product[]
  ): FormattedVendor {
    // Get products for this vendor
    const vendorProducts = products.filter(product => 
      product.vendorId === vendor.id && product.isActive
    );

    // Get unique products (counting grouped products as one)
    const uniqueProducts = this.getUniqueProducts(vendorProducts);

    // Get related companies
    const companyIds = [...new Set(vendorProducts.map(product => product.companyId))];
    const relatedCompanies = companies
      .filter(company => companyIds.includes(company.id))
      .map(company => ({
        id: company.id,
        tradingName: company.tradingName,
        logo: company.logo
      }));

    // Format vendor products for display
    const formattedVendorProducts = vendorProducts.map(product => {
      const company = companies.find(c => c.id === product.companyId);
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency,
        companyName: company?.tradingName || 'Unknown',
        formattedPrice: `${product.currency} ${product.price.toFixed(2)}`
      };
    });

    // Pre-construct URLs
    const websiteUrl = vendor.website 
      ? (vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`)
      : '';
    
    const mailtoLink = vendor.contactEmail ? `mailto:${vendor.contactEmail}` : '';
    const phoneLink = vendor.phone ? `tel:${vendor.phone}` : '';

    return {
      ...vendor,
      relatedCompanies,
      productCount: vendorProducts.length,
      uniqueProductCount: uniqueProducts.length,
      vendorProducts: formattedVendorProducts,
      formattedCreatedAt: formatDateForDisplay(vendor.createdAt.split('T')[0]),
      formattedUpdatedAt: formatDateForDisplay(vendor.updatedAt.split('T')[0]),
      websiteUrl,
      mailtoLink,
      phoneLink,
      hasMultipleCompanies: relatedCompanies.length > 1
    };
  }

  static getUniqueProducts(products: Product[]): Product[] {
    const uniqueProducts = [];
    const seenGroups = new Set();
    const seenIndividuals = new Set();

    for (const product of products) {
      if (product.groupId) {
        // If this is a grouped product and we haven't seen this group yet
        if (!seenGroups.has(product.groupId)) {
          seenGroups.add(product.groupId);
          uniqueProducts.push(product);
        }
      } else {
        // If this is an individual product and we haven't seen it yet
        if (!seenIndividuals.has(product.id)) {
          seenIndividuals.add(product.id);
          uniqueProducts.push(product);
        }
      }
    }

    return uniqueProducts;
  }

  static filterVendors(
    vendors: Vendor[],
    filters: VendorFilters
  ): Vendor[] {
    return vendors.filter(vendor => {
      // Filter by selected company
      const matchesCompany = filters.companyFilter === 'all' || 
                            vendor.companyId === filters.companyFilter;
      
      // Filter by search term
      const matchesSearch = !filters.searchTerm.trim() ||
                           vendor.companyName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           vendor.contactPerson.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           vendor.contactEmail.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      // Filter by status
      const matchesStatus = filters.statusFilter === 'all' || 
                           (filters.statusFilter === 'active' && vendor.isActive) ||
                           (filters.statusFilter === 'inactive' && !vendor.isActive);
      
      return matchesCompany && matchesSearch && matchesStatus;
    });
  }

  static calculateStatistics(vendors: Vendor[]): VendorStatistics {
    const activeVendors = vendors.filter(v => v.isActive);
    const inactiveVendors = vendors.filter(v => !v.isActive);
    
    const avgPaymentTerms = vendors.length > 0 
      ? Math.round(vendors.reduce((sum, v) => sum + v.paymentTerms, 0) / vendors.length)
      : 0;

    return {
      total: vendors.length,
      active: activeVendors.length,
      inactive: inactiveVendors.length,
      avgPaymentTerms
    };
  }

  static createVendor(vendorData: NewVendor, customPaymentTerms?: string): Vendor {
    const paymentTermsDays = vendorData.paymentTerms === 'custom' 
      ? parseInt(customPaymentTerms || '30') 
      : parseInt(vendorData.paymentTerms);

    return {
      id: `vendor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      companyName: vendorData.companyName.trim(),
      contactPerson: vendorData.contactPerson.trim(),
      contactEmail: vendorData.contactEmail.trim(),
      phone: vendorData.phone.trim(),
      website: vendorData.website.trim(),
      paymentTerms: paymentTermsDays,
      currency: vendorData.currency,
      paymentMethod: vendorData.paymentMethod,
      billingAddress: vendorData.billingAddress.trim(),
      itemsServicesSold: vendorData.itemsServicesSold.trim(),
      notes: vendorData.notes.trim(),
      companyRegistrationNr: vendorData.companyRegistrationNr.trim(),
      vatNr: vendorData.vatNr.trim(),
      vendorCountry: vendorData.vendorCountry.trim(),
      companyId: vendorData.companyId as number,
      isActive: true,
      createdAt: getLocalDateTimeString(),
      updatedAt: getLocalDateTimeString()
    };
  }

  static updateVendor(
    existingVendor: Vendor, 
    vendorData: NewVendor, 
    customPaymentTerms?: string
  ): Vendor {
    const paymentTermsDays = vendorData.paymentTerms === 'custom' 
      ? parseInt(customPaymentTerms || '30') 
      : parseInt(vendorData.paymentTerms);

    return {
      ...existingVendor,
      companyName: vendorData.companyName.trim(),
      contactPerson: vendorData.contactPerson.trim(),
      contactEmail: vendorData.contactEmail.trim(),
      phone: vendorData.phone.trim(),
      website: vendorData.website.trim(),
      paymentTerms: paymentTermsDays,
      currency: vendorData.currency,
      paymentMethod: vendorData.paymentMethod,
      billingAddress: vendorData.billingAddress.trim(),
      itemsServicesSold: vendorData.itemsServicesSold.trim(),
      notes: vendorData.notes.trim(),
      companyRegistrationNr: vendorData.companyRegistrationNr.trim(),
      vatNr: vendorData.vatNr.trim(),
      vendorCountry: vendorData.vendorCountry.trim(),
      companyId: vendorData.companyId as number,
      updatedAt: getLocalDateTimeString()
    };
  }

  static getFilteredProducts(
    products: Product[],
    companyId: number | '',
    globalSelectedCompany: number | 'all',
    searchTerm: string
  ): Array<Product & { formattedPrice: string }> {
    let filtered = products.filter(product => product.isActive);
    
    // Filter by company
    if (typeof companyId === 'number') {
      filtered = filtered.filter(product => product.companyId === companyId);
    } else if (globalSelectedCompany !== 'all') {
      filtered = filtered.filter(product => product.companyId === (globalSelectedCompany as number));
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Add formatted price
    return filtered.map(product => ({
      ...product,
      formattedPrice: `${product.currency} ${product.price.toFixed(2)}`
    }));
  }

  static updateProductVendorAssociations(
    products: Product[],
    vendorId: string,
    selectedProductIds: string[],
    isCreatingVendor: boolean = false
  ): Product[] {
    return products.map(product => {
      // If creating a new vendor or this product was selected
      if (selectedProductIds.includes(product.id)) {
        return { ...product, vendorId, updatedAt: getLocalDateTimeString() };
      }
      
      // If updating and this product was previously associated but now unselected
      if (!isCreatingVendor && product.vendorId === vendorId && !selectedProductIds.includes(product.id)) {
        return { ...product, vendorId: null, updatedAt: getLocalDateTimeString() };
      }
      
      return product;
    });
  }

  static syncGroupProductVendors(
    products: Product[],
    selectedProductIds: string[],
    vendorId: string
  ): Product[] {
    return products.map(product => {
      // Skip if this product was already updated or doesn't have a group
      if (selectedProductIds.includes(product.id) || !product.groupId) {
        return product;
      }
      
      // Check if any selected product is in the same group
      const hasGroupMember = products.some(p => 
        selectedProductIds.includes(p.id) && p.groupId === product.groupId
      );
      
      if (hasGroupMember) {
        return { ...product, vendorId, updatedAt: getLocalDateTimeString() };
      }
      
      return product;
    });
  }
}