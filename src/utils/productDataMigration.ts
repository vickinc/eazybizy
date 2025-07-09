import { ProductStorageService } from '@/services/storage/productStorageService';
import { productApiService } from '@/services/api/productApiService';
import { toast } from 'sonner';

export class ProductDataMigration {
  static async migrateProductsToDatabase(): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      // Get all products from localStorage
      const localProducts = ProductStorageService.getProducts();
      
      if (localProducts.length === 0) {
        toast.info('No products to migrate');
        return results;
      }

      toast.info(`Starting migration of ${localProducts.length} products...`);

      // Migrate each product
      for (const product of localProducts) {
        try {
          await productApiService.createProduct({
            name: product.name,
            description: product.description,
            price: product.price,
            currency: product.currency,
            cost: product.cost,
            costCurrency: product.costCurrency,
            isActive: product.isActive,
            companyId: product.companyId
          });
          
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Failed to migrate product "${product.name}": ${error}`);
          console.error(`Failed to migrate product ${product.id}:`, error);
        }
      }

      // Clear localStorage after successful migration
      if (results.success > 0 && results.failed === 0) {
        ProductStorageService.clearProducts();
        toast.success(`Successfully migrated all ${results.success} products`);
      } else if (results.success > 0) {
        toast.warning(`Migrated ${results.success} products, ${results.failed} failed`);
      } else {
        toast.error('Migration failed for all products');
      }

    } catch (error) {
      console.error('Product migration error:', error);
      toast.error('Failed to complete product migration');
      results.errors.push(`Migration error: ${error}`);
    }

    return results;
  }

  static async checkForLocalProducts(): Promise<boolean> {
    const localProducts = ProductStorageService.getProducts();
    return localProducts.length > 0;
  }
}

// Helper function to trigger migration from console or admin panel
export async function migrateProducts() {
  const hasLocalProducts = await ProductDataMigration.checkForLocalProducts();
  
  if (!hasLocalProducts) {
    return;
  }

  if (confirm('This will migrate all local products to the database. Continue?')) {
    const results = await ProductDataMigration.migrateProductsToDatabase();
  }
}