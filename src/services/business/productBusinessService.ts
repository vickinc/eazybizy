import { Product, FormattedProduct, Vendor } from '@/types/products.types';
import { Company } from '@/types/company.types';
import { getLocalDateTimeString, formatDateForDisplay } from '@/utils';

export class ProductBusinessService {
  static formatProductForDisplay(
    product: Product, 
    company: Company | undefined,
    group: null,
    vendor: Vendor | null
  ): FormattedProduct {
    const marginPercentage = product.price > 0 
      ? ((product.price - product.cost) / product.price) * 100 
      : 0;
    
    const marginColor = marginPercentage > 50 
      ? 'text-green-600' 
      : marginPercentage > 20 
        ? 'text-yellow-600' 
        : 'text-red-600';

    return {
      ...product,
      // Company Information
      companyName: company?.tradingName || 'Unknown',
      companyLogo: company?.logo || '',
      companyTradingName: company?.tradingName || 'Unknown',
      
      
      // Vendor Information - prioritize API response vendor over hook vendor
      vendorName: (product as any).vendor?.companyName || vendor?.companyName,
      
      // Calculated Fields
      marginPercentage,
      marginColor,
      
      // Formatted Dates
      formattedCreatedAt: formatDateForDisplay(product.createdAt.split('T')[0]),
      formattedUpdatedAt: formatDateForDisplay(product.updatedAt.split('T')[0])
    };
  }

  static createProduct(baseData: {
    name: string;
    description: string;
    price: number;
    currency: string;
    cost: number;
    costCurrency: string;
    vendorId: string;
    companyId: number;
  }): Product {
    return {
      ...baseData,
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isActive: true,
      createdAt: getLocalDateTimeString(),
      updatedAt: getLocalDateTimeString()
    };
  }


  static filterProducts(
    products: Product[],
    filters: {
      searchTerm: string;
      statusFilter: 'all' | 'active' | 'inactive';
      companyFilter: number | 'all';
      currencyFilter: string;
      vendorFilter: string;
      sortField: string;
      sortDirection: 'asc' | 'desc';
    }
  ): Product[] {
    const filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      const matchesStatus = filters.statusFilter === 'all' || 
                           (filters.statusFilter === 'active' && product.isActive) ||
                           (filters.statusFilter === 'inactive' && !product.isActive);
      
      const matchesCompany = filters.companyFilter === 'all' || 
                            product.companyId === filters.companyFilter;
      
      const matchesCurrency = filters.currencyFilter === 'all' ||
                             product.currency === filters.currencyFilter;
      
      const matchesVendor = filters.vendorFilter === 'all' ||
                           product.vendorId === filters.vendorFilter;
      
      return matchesSearch && matchesStatus && matchesCompany && matchesCurrency && matchesVendor;
    });

    // Sort products
    filtered.sort((a, b) => {
      let aValue: unknown;
      let bValue: unknown;

      switch (filters.sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'cost':
          aValue = a.cost;
          bValue = b.cost;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return filters.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }

  static calculateStatistics(products: Product[]): {
    totalProducts: number;
    activeProducts: number;
    avgPrice: number;
    avgMargin: number;
  } {
    const activeProducts = products.filter(p => p.isActive);
    
    const avgPrice = activeProducts.length > 0 
      ? activeProducts.reduce((sum, p) => sum + p.price, 0) / activeProducts.length 
      : 0;
    
    const avgMargin = activeProducts.length > 0 
      ? activeProducts.reduce((sum, p) => {
          const margin = p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
          return sum + margin;
        }, 0) / activeProducts.length 
      : 0;

    return {
      totalProducts: activeProducts.length,
      activeProducts: activeProducts.length,
      avgPrice,
      avgMargin
    };
  }

  static calculateMargin(price: number, cost: number): number {
    if (price <= 0) return 0;
    return ((price - cost) / price) * 100;
  }
}