import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    // Connection pool settings
    family: 4,
    keepAlive: 30000,
    connectTimeout: 2000,
    commandTimeout: 1000,
    // Graceful fallback when Redis is not available
    enableOfflineQueue: false,
  })

// Handle Redis connection errors gracefully
redis.on('error', (error) => {
  // Suppress connection refused errors (expected when Redis is not running)
  if (error.code === 'ECONNREFUSED') {
    console.warn('Redis not available - using in-memory fallback cache')
  } else {
    console.error('Redis error:', error.message)
  }
})

redis.on('connect', () => {
})

redis.on('ready', () => {
})

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Cache key generators
export const CacheKeys = {
  companies: {
    list: (filters: Record<string, any>) => `companies:list:${JSON.stringify(filters)}`,
    item: (id: string | number) => `companies:item:${id}`,
    stats: () => 'companies:stats:global',
    search: (term: string, filters: Record<string, any>) => 
      `companies:search:${term}:${JSON.stringify(filters)}`,
    count: (filters: Record<string, any>) => `companies:count:${JSON.stringify(filters)}`,
  },
  calendar: {
    events: (filters: Record<string, any>) => `calendar:events:${JSON.stringify(filters)}`,
    stats: () => 'calendar:stats:global',
  },
  notes: {
    list: (filters: Record<string, any>) => `notes:list:${JSON.stringify(filters)}`,
    stats: () => 'notes:stats:global',
  },
  businessCards: {
    list: (filters: Record<string, any>) => `business-cards:list:${JSON.stringify(filters)}`,
    item: (id: string | number) => `business-cards:item:${id}`,
    stats: () => 'business-cards:stats:global',
  },
  products: {
    list: (filters: Record<string, any>) => `products:list:${JSON.stringify(filters)}`,
    item: (id: string | number) => `products:item:${id}`,
    stats: () => 'products:stats:global',
  },
  vendors: {
    list: (filters: Record<string, any>) => `vendors:list:${JSON.stringify(filters)}`,
    item: (id: string | number) => `vendors:item:${id}`,
    stats: () => 'vendors:stats:global',
  },
  clients: {
    list: (filters: Record<string, any>) => `clients:list:${JSON.stringify(filters)}`,
    item: (id: string | number) => `clients:item:${id}`,
    stats: () => 'clients:stats:global',
  },
  invoices: {
    list: (filters: Record<string, any>) => `invoices:list:${JSON.stringify(filters)}`,
    item: (id: string | number) => `invoices:item:${id}`,
    stats: () => 'invoices:stats:global',
  },
  bankAccounts: {
    list: (filters: Record<string, any>) => `bank-accounts:list:${JSON.stringify(filters)}`,
    item: (id: string | number) => `bank-accounts:item:${id}`,
  },
  digitalWallets: {
    list: (filters: Record<string, any>) => `digital-wallets:list:${JSON.stringify(filters)}`,
    item: (id: string | number) => `digital-wallets:item:${id}`,
  },
}

// Cache TTL constants (in seconds)
export const CacheTTL = {
  companies: {
    list: 15 * 60,      // 15 minutes
    item: 30 * 60,      // 30 minutes  
    stats: 30 * 60,     // 30 minutes
    search: 5 * 60,     // 5 minutes
    count: 10 * 60,     // 10 minutes
  },
  calendar: {
    events: 5 * 60,     // 5 minutes
    stats: 15 * 60,     // 15 minutes
  },
  notes: {
    list: 10 * 60,      // 10 minutes
    stats: 15 * 60,     // 15 minutes
  },
  businessCards: {
    list: 10 * 60,      // 10 minutes
    item: 30 * 60,      // 30 minutes
    stats: 15 * 60,     // 15 minutes
  },
  products: {
    list: 15 * 60,      // 15 minutes (products change less frequently)
    item: 30 * 60,      // 30 minutes
    stats: 30 * 60,     // 30 minutes
  },
  vendors: {
    list: 20 * 60,      // 20 minutes (vendors change infrequently)
    item: 45 * 60,      // 45 minutes
    stats: 30 * 60,     // 30 minutes
  },
  clients: {
    list: 10 * 60,      // 10 minutes (clients more dynamic)
    item: 30 * 60,      // 30 minutes
    stats: 15 * 60,     // 15 minutes
  },
  invoices: {
    list: 5 * 60,       // 5 minutes (invoices highly dynamic)
    item: 15 * 60,      // 15 minutes
    stats: 10 * 60,     // 10 minutes
  },
  bankAccounts: {
    list: 30 * 60,      // 30 minutes (bank accounts rarely change)
    item: 60 * 60,      // 60 minutes
  },
  digitalWallets: {
    list: 30 * 60,      // 30 minutes (wallets rarely change)
    item: 60 * 60,      // 60 minutes
  },
}

// Fallback in-memory cache when Redis is not available
const memoryCache = new Map<string, { value: unknown; expires: number }>()

// Cache utilities
export class CacheService {
  private static async isRedisAvailable(): Promise<boolean> {
    try {
      await redis.ping()
      return true
    } catch {
      return false
    }
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const isRedisUp = await this.isRedisAvailable()
      
      if (isRedisUp) {
        const value = await redis.get(key)
        return value ? JSON.parse(value) : null
      } else {
        // Fallback to memory cache
        const cached = memoryCache.get(key)
        if (cached && cached.expires > Date.now()) {
          return cached.value
        }
        return null
      }
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  static async set(key: string, value: unknown, ttl?: number): Promise<boolean> {
    try {
      const isRedisUp = await this.isRedisAvailable()
      
      if (isRedisUp) {
        if (ttl) {
          await redis.setex(key, ttl, JSON.stringify(value))
        } else {
          await redis.set(key, JSON.stringify(value))
        }
      } else {
        // Fallback to memory cache
        const expires = ttl ? Date.now() + (ttl * 1000) : Date.now() + (60 * 60 * 1000) // 1 hour default
        memoryCache.set(key, { value, expires })
      }
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  static async del(key: string): Promise<boolean> {
    try {
      const isRedisUp = await this.isRedisAvailable()
      
      if (isRedisUp) {
        await redis.del(key)
      } else {
        memoryCache.delete(key)
      }
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  static async delPattern(pattern: string): Promise<number> {
    try {
      const isRedisUp = await this.isRedisAvailable()
      
      if (isRedisUp) {
        const keys = await redis.keys(pattern)
        if (keys.length > 0) {
          return await redis.del(...keys)
        }
        return 0
      } else {
        // Fallback: delete from memory cache using pattern matching
        let deletedCount = 0
        const regex = new RegExp(pattern.replace(/\*/g, '.*'))
        for (const key of memoryCache.keys()) {
          if (regex.test(key)) {
            memoryCache.delete(key)
            deletedCount++
          }
        }
        return deletedCount
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error)
      return 0
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const exists = await redis.exists(key)
      return exists === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  static async increment(key: string, by: number = 1): Promise<number> {
    try {
      return await redis.incrby(key, by)
    } catch (error) {
      console.error('Cache increment error:', error)
      return 0
    }
  }

  static async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) return []
      const values = await redis.mget(...keys)
      return values.map(value => value ? JSON.parse(value) : null)
    } catch (error) {
      console.error('Cache getMany error:', error)
      return keys.map(() => null)
    }
  }

  static async setMany(items: Array<{key: string, value: unknown, ttl?: number}>): Promise<boolean> {
    try {
      const pipeline = redis.pipeline()
      
      for (const item of items) {
        if (item.ttl) {
          pipeline.setex(item.key, item.ttl, JSON.stringify(item.value))
        } else {
          pipeline.set(item.key, JSON.stringify(item.value))
        }
      }
      
      await pipeline.exec()
      return true
    } catch (error) {
      console.error('Cache setMany error:', error)
      return false
    }
  }
}

// Redis health check
export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping()
    return true
  } catch (error) {
    console.error('Redis connection failed:', error)
    return false
  }
}