import { Product } from '@/types/products.types';

const PRODUCTS_STORAGE_KEY = 'app-products';

export class ProductStorageService {
  static getProducts(): Product[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const savedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);
        // Handle migration for existing products without new fields
        return parsedProducts.map((product: Partial<Product>) => ({
          ...product,
          companyId: product.companyId || 1,
          vendorId: product.vendorId || 'N/A'
        }));
      }
    } catch (error) {
      console.error('Error loading products from localStorage:', error);
    }
    return [];
  }

  static saveProducts(products: Product[]): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
      window.dispatchEvent(new CustomEvent('productsUpdated'));
      return true;
    } catch (error) {
      console.error('Error saving products to localStorage:', error);
      return false;
    }
  }

  static clearProducts(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      localStorage.removeItem(PRODUCTS_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('productsUpdated'));
      return true;
    } catch (error) {
      console.error('Error clearing products from localStorage:', error);
      return false;
    }
  }
}
