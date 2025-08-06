import { prisma, executeWithRetry } from '@/lib/prisma';
import { CurrencyRate } from '@/types';

export interface DatabaseCurrencyRate {
  id: string;
  code: string;
  name: string;
  rate: number;
  type: string;
  source: string;
  isActive: boolean;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CurrencyRateCreateInput {
  code: string;
  name: string;
  rate: number;
  type: 'fiat' | 'crypto';
  source?: string;
  isActive?: boolean;
}

export interface CurrencyRateUpdateInput {
  name?: string;
  rate?: number;
  source?: string;
  isActive?: boolean;
  lastUpdated?: Date;
}

export class CurrencyRatesDatabaseService {
  
  /**
   * Find all active currency rates
   */
  static async findAll(): Promise<DatabaseCurrencyRate[]> {
    return executeWithRetry(async () => {
      return await prisma.currencyRate.findMany({
        where: { isActive: true },
        orderBy: [
          { type: 'asc' },
          { code: 'asc' }
        ]
      });
    });
  }

  /**
   * Find currency rates by type (fiat or crypto)
   */
  static async findByType(type: 'fiat' | 'crypto'): Promise<DatabaseCurrencyRate[]> {
    return executeWithRetry(async () => {
      return await prisma.currencyRate.findMany({
        where: { 
          type,
          isActive: true 
        },
        orderBy: { code: 'asc' }
      });
    });
  }

  /**
   * Find a specific currency rate by code
   */
  static async findByCode(code: string): Promise<DatabaseCurrencyRate | null> {
    return executeWithRetry(async () => {
      return await prisma.currencyRate.findUnique({
        where: { code }
      });
    });
  }

  /**
   * Create or update a currency rate (upsert)
   */
  static async upsert(code: string, data: CurrencyRateCreateInput): Promise<DatabaseCurrencyRate> {
    return executeWithRetry(async () => {
      return await prisma.currencyRate.upsert({
        where: { code },
        create: {
          code: data.code,
          name: data.name,
          rate: data.rate,
          type: data.type,
          source: data.source || 'manual',
          isActive: data.isActive ?? true,
          lastUpdated: new Date()
        },
        update: {
          name: data.name,
          rate: data.rate,
          type: data.type,
          source: data.source || 'manual',
          isActive: data.isActive ?? true,
          lastUpdated: new Date()
        }
      });
    });
  }

  /**
   * Bulk upsert multiple currency rates
   */
  static async bulkUpsert(rates: CurrencyRateCreateInput[]): Promise<void> {
    return executeWithRetry(async () => {
      await prisma.$transaction(async (tx) => {
        for (const rate of rates) {
          await tx.currencyRate.upsert({
            where: { code: rate.code },
            create: {
              code: rate.code,
              name: rate.name,
              rate: rate.rate,
              type: rate.type,
              source: rate.source || 'manual',
              isActive: rate.isActive ?? true,
              lastUpdated: new Date()
            },
            update: {
              name: rate.name,
              rate: rate.rate,
              type: rate.type,
              source: rate.source || 'manual',
              isActive: rate.isActive ?? true,
              lastUpdated: new Date()
            }
          });
        }
      });
    });
  }

  /**
   * Update a currency rate by code
   */
  static async updateByCode(code: string, data: CurrencyRateUpdateInput): Promise<DatabaseCurrencyRate> {
    return executeWithRetry(async () => {
      return await prisma.currencyRate.update({
        where: { code },
        data: {
          ...data,
          lastUpdated: data.lastUpdated || new Date()
        }
      });
    });
  }

  /**
   * Update the rate value for a specific currency
   */
  static async updateRate(code: string, rate: number, source = 'manual'): Promise<DatabaseCurrencyRate> {
    return executeWithRetry(async () => {
      return await prisma.currencyRate.update({
        where: { code },
        data: {
          rate,
          source,
          lastUpdated: new Date()
        }
      });
    });
  }

  /**
   * Soft delete a currency rate (set isActive to false)
   */
  static async softDelete(code: string): Promise<DatabaseCurrencyRate> {
    return executeWithRetry(async () => {
      return await prisma.currencyRate.update({
        where: { code },
        data: {
          isActive: false,
          lastUpdated: new Date()
        }
      });
    });
  }

  /**
   * Hard delete a currency rate
   */
  static async delete(code: string): Promise<void> {
    return executeWithRetry(async () => {
      await prisma.currencyRate.delete({
        where: { code }
      });
    });
  }

  /**
   * Get currency rates statistics
   */
  static async getStats(): Promise<{
    totalRates: number;
    fiatRates: number;
    cryptoRates: number;
    lastUpdated: Date | null;
  }> {
    return executeWithRetry(async () => {
      const [total, fiat, crypto, latest] = await Promise.all([
        prisma.currencyRate.count({ where: { isActive: true } }),
        prisma.currencyRate.count({ where: { type: 'fiat', isActive: true } }),
        prisma.currencyRate.count({ where: { type: 'crypto', isActive: true } }),
        prisma.currencyRate.findFirst({
          where: { isActive: true },
          orderBy: { lastUpdated: 'desc' },
          select: { lastUpdated: true }
        })
      ]);

      return {
        totalRates: total,
        fiatRates: fiat,
        cryptoRates: crypto,
        lastUpdated: latest?.lastUpdated || null
      };
    });
  }

  /**
   * Convert database currency rate to application CurrencyRate type
   */
  static toCurrencyRate(dbRate: DatabaseCurrencyRate): CurrencyRate {
    return {
      code: dbRate.code,
      name: dbRate.name,
      rate: dbRate.rate,
      type: dbRate.type as 'fiat' | 'crypto',
      lastUpdated: dbRate.lastUpdated.toISOString()
    };
  }

  /**
   * Convert application CurrencyRate to database input
   */
  static fromCurrencyRate(rate: CurrencyRate): CurrencyRateCreateInput {
    return {
      code: rate.code,
      name: rate.name,
      rate: rate.rate,
      type: rate.type,
      source: 'manual'
    };
  }

  /**
   * Convert multiple database rates to application format
   */
  static toCurrencyRates(dbRates: DatabaseCurrencyRate[]): CurrencyRate[] {
    return dbRates.map(this.toCurrencyRate);
  }

  /**
   * Initialize default currency rates if database is empty
   */
  static async initializeDefaults(defaultRates: CurrencyRate[]): Promise<void> {
    return executeWithRetry(async () => {
      // Check if any rates exist
      const existingCount = await prisma.currencyRate.count();
      
      if (existingCount === 0) {
        // Database is empty, insert defaults
        const createInputs = defaultRates.map(rate => ({
          code: rate.code,
          name: rate.name,
          rate: rate.rate,
          type: rate.type,
          source: 'system' as const,
          isActive: true
        }));

        await this.bulkUpsert(createInputs);
        console.log(`Initialized ${defaultRates.length} default currency rates`);
      }
    });
  }

  /**
   * Migrate data from localStorage format to database
   */
  static async migrateFromLocalStorage(
    fiatRates: CurrencyRate[], 
    cryptoRates: CurrencyRate[]
  ): Promise<void> {
    const allRates = [...fiatRates, ...cryptoRates];
    const createInputs = allRates.map(rate => ({
      code: rate.code,
      name: rate.name,
      rate: rate.rate,
      type: rate.type,
      source: 'migration' as const,
      isActive: true
    }));

    await this.bulkUpsert(createInputs);
    console.log(`Migrated ${allRates.length} currency rates from localStorage to database`);
  }
}