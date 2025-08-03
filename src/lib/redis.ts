import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
  redisPromise: Promise<Redis> | undefined
}

// Lazy-loaded Redis instance
let redisInstance: Redis | null = null
let connectionAttempted = false

function createRedisInstance(): Redis {
  const instance = new Redis(process.env.REDIS_URL || {
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
  instance.on('error', (error) => {
    // Suppress connection refused errors (expected when Redis is not running)
    if (error.code === 'ECONNREFUSED') {
      console.warn('Redis not available - using in-memory fallback cache')
    } else {
      console.error('Redis error:', error.message)
    }
  })

  return instance
}

// Get or create Redis instance lazily
async function getRedisInstance(): Promise<Redis | null> {
  if (redisInstance) {
    return redisInstance
  }

  if (!connectionAttempted) {
    connectionAttempted = true
    
    if (!globalForRedis.redisPromise) {
      globalForRedis.redisPromise = (async () => {
        try {
          const instance = createRedisInstance()
          await instance.connect()
          redisInstance = instance
          
          if (process.env.NODE_ENV !== 'production') {
            globalForRedis.redis = instance
          }
          
          return instance
        } catch (error) {
          console.warn('Redis connection failed, using in-memory cache fallback')
          return null
        }
      })()
    }

    return globalForRedis.redisPromise
  }

  return null
}

// Export a proxy that lazily initializes Redis
export const redis = new Proxy({} as Redis, {
  get(target, prop) {
    throw new Error('Direct redis access is deprecated. Use CacheService instead.')
  }
})

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
  cashflow: {
    list: (filters: Record<string, any>) => `cashflow:list:${JSON.stringify(filters)}`,
    item: (id: string | number) => `cashflow:item:${id}`,
    summary: (filters: Record<string, any>) => `cashflow:summary:${JSON.stringify(filters)}`,
  },
}

// Cache TTL constants (in seconds)
export const CacheTTL = {
  companies: {
    list: 2,            // 2 seconds for immediate updates
    item: 5,            // 5 seconds for immediate updates  
    stats: 10,          // 10 seconds for immediate updates
    search: 2,          // 2 seconds for immediate updates
    count: 2,           // 2 seconds for immediate updates
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
  cashflow: {
    list: 5 * 60,       // 5 minutes (cashflow is dynamic)
    item: 10 * 60,      // 10 minutes
    summary: 5 * 60,    // 5 minutes
  },
}

// Fallback in-memory cache when Redis is not available
const memoryCache = new Map<string, { value: unknown; expires: number }>()

// Cache utilities
export class CacheService {
  private static redisInstance: Redis | null | undefined = undefined

  private static async getRedis(): Promise<Redis | null> {
    if (this.redisInstance !== undefined) {
      return this.redisInstance
    }
    
    this.redisInstance = await getRedisInstance()
    return this.redisInstance
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const redis = await this.getRedis()
      
      if (redis) {
        const value = await redis.get(key)
        return value ? JSON.parse(value) : null
      } else {
        // Fallback to memory cache
        const cached = memoryCache.get(key)
        if (cached && cached.expires > Date.now()) {
          return cached.value as T
        }
        return null
      }
    } catch (error) {
      // Fallback to memory cache on any error
      const cached = memoryCache.get(key)
      if (cached && cached.expires > Date.now()) {
        return cached.value as T
      }
      return null
    }
  }

  static async set(key: string, value: unknown, ttl?: number): Promise<boolean> {
    try {
      const redis = await this.getRedis()
      
      if (redis) {
        if (ttl) {
          await redis.setex(key, ttl, JSON.stringify(value))
        } else {
          await redis.set(key, JSON.stringify(value))
        }
      } else {
        // Fallback to memory cache
        const expires = ttl ? Date.now() + (ttl * 1000) : Date.now() + (5 * 1000) // 5 seconds default
        memoryCache.set(key, { value, expires })
      }
      return true
    } catch (error) {
      // Fallback to memory cache on any error
      const expires = ttl ? Date.now() + (ttl * 1000) : Date.now() + (5 * 1000)
      memoryCache.set(key, { value, expires })
      return true
    }
  }

  static async del(key: string): Promise<boolean> {
    try {
      const redis = await this.getRedis()
      
      if (redis) {
        await redis.del(key)
      }
      memoryCache.delete(key)
      return true
    } catch (error) {
      memoryCache.delete(key)
      return true
    }
  }

  static async delPattern(pattern: string): Promise<number> {
    try {
      let deletedCount = 0
      const redis = await this.getRedis()
      
      if (redis) {
        const keys = await redis.keys(pattern)
        if (keys.length > 0) {
          deletedCount = await redis.del(...keys)
        }
      }
      
      // Also delete from memory cache using pattern matching
      const regex = new RegExp(pattern.replace(/\*/g, '.*'))
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          memoryCache.delete(key)
          deletedCount++
        }
      }
      
      return deletedCount
    } catch (error) {
      // Fallback: delete from memory cache only
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
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const redis = await this.getRedis()
      
      if (redis) {
        const exists = await redis.exists(key)
        return exists === 1
      } else {
        const cached = memoryCache.get(key)
        return cached !== undefined && cached.expires > Date.now()
      }
    } catch (error) {
      const cached = memoryCache.get(key)
      return cached !== undefined && cached.expires > Date.now()
    }
  }

  static async increment(key: string, by: number = 1): Promise<number> {
    try {
      const redis = await this.getRedis()
      
      if (redis) {
        return await redis.incrby(key, by)
      } else {
        // Simple in-memory increment
        const current = await this.get<number>(key) || 0
        const newValue = current + by
        await this.set(key, newValue)
        return newValue
      }
    } catch (error) {
      const current = await this.get<number>(key) || 0
      const newValue = current + by
      await this.set(key, newValue)
      return newValue
    }
  }

  static async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) return []
      
      const redis = await this.getRedis()
      
      if (redis) {
        const values = await redis.mget(...keys)
        return values.map(value => value ? JSON.parse(value) : null)
      } else {
        // Fallback to memory cache
        return keys.map(key => {
          const cached = memoryCache.get(key)
          if (cached && cached.expires > Date.now()) {
            return cached.value as T
          }
          return null
        })
      }
    } catch (error) {
      return keys.map(key => {
        const cached = memoryCache.get(key)
        if (cached && cached.expires > Date.now()) {
          return cached.value as T
        }
        return null
      })
    }
  }

  static async setMany(items: Array<{key: string, value: unknown, ttl?: number}>): Promise<boolean> {
    try {
      const redis = await this.getRedis()
      
      if (redis) {
        const pipeline = redis.pipeline()
        
        for (const item of items) {
          if (item.ttl) {
            pipeline.setex(item.key, item.ttl, JSON.stringify(item.value))
          } else {
            pipeline.set(item.key, JSON.stringify(item.value))
          }
        }
        
        await pipeline.exec()
      } else {
        // Fallback to memory cache
        for (const item of items) {
          const expires = item.ttl ? Date.now() + (item.ttl * 1000) : Date.now() + (5 * 1000)
          memoryCache.set(item.key, { value: item.value, expires })
        }
      }
      return true
    } catch (error) {
      // Fallback to memory cache
      for (const item of items) {
        const expires = item.ttl ? Date.now() + (item.ttl * 1000) : Date.now() + (5 * 1000)
        memoryCache.set(item.key, { value: item.value, expires })
      }
      return true
    }
  }
}

// Redis health check
export async function checkRedisConnection(): Promise<boolean> {
  try {
    const redis = await getRedisInstance()
    if (redis) {
      await redis.ping()
      return true
    }
    return false
  } catch (error) {
    return false
  }
}