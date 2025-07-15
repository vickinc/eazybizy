import { NextResponse } from 'next/server'

interface CompressionOptions {
  threshold?: number // Minimum size to compress (default: 1024 bytes)
  level?: number     // Compression level 1-9 (default: 6)
}

export class ResponseCompression {
  private static readonly DEFAULT_THRESHOLD = 1024 // 1KB
  private static readonly DEFAULT_LEVEL = 6

  /**
   * Compress response data and return NextResponse with appropriate headers
   */
  static async compressResponse(
    data: unknown,
    acceptEncoding: string | null = null,
    options: CompressionOptions = {}
  ): Promise<NextResponse> {
    const { threshold = this.DEFAULT_THRESHOLD, level = this.DEFAULT_LEVEL } = options

    // Convert data to JSON string
    const jsonData = JSON.stringify(data)
    const dataBuffer = Buffer.from(jsonData, 'utf-8')

    // Don't compress if data is too small
    if (dataBuffer.length < threshold) {
      return NextResponse.json(data, {
        headers: {
          'Content-Length': dataBuffer.length.toString(),
          'Content-Type': 'application/json; charset=utf-8'
        }
      })
    }

    // Determine compression method based on Accept-Encoding header
    const encoding = this.getBestEncoding(acceptEncoding)

    if (!encoding) {
      // No compression support
      return NextResponse.json(data, {
        headers: {
          'Content-Length': dataBuffer.length.toString(),
          'Content-Type': 'application/json; charset=utf-8'
        }
      })
    }

    try {
      let compressedData: Buffer
      
      // Dynamic import of zlib and util
      const { gzip, deflate } = await import('zlib')
      const { promisify } = await import('util')
      
      const gzipAsync = promisify(gzip)
      const deflateAsync = promisify(deflate)
      
      switch (encoding) {
        case 'gzip':
          compressedData = await gzipAsync(dataBuffer, { level })
          break
        case 'deflate':
          compressedData = await deflateAsync(dataBuffer, { level })
          break
        default:
          // Fallback to uncompressed
          return NextResponse.json(data, {
            headers: {
              'Content-Length': dataBuffer.length.toString(),
              'Content-Type': 'application/json; charset=utf-8'
            }
          })
      }

      // Calculate compression ratio
      const compressionRatio = ((dataBuffer.length - compressedData.length) / dataBuffer.length * 100).toFixed(1)
      

      return new NextResponse(compressedData, {
        headers: {
          'Content-Encoding': encoding,
          'Content-Length': compressedData.length.toString(),
          'Content-Type': 'application/json; charset=utf-8',
          'Vary': 'Accept-Encoding',
          'X-Compression-Ratio': compressionRatio
        }
      })
    } catch (error) {
      console.error('Compression failed:', error)
      // Fallback to uncompressed response
      return NextResponse.json(data, {
        headers: {
          'Content-Length': dataBuffer.length.toString(),
          'Content-Type': 'application/json; charset=utf-8'
        }
      })
    }
  }

  /**
   * Parse Accept-Encoding header and return the best supported encoding
   */
  private static getBestEncoding(acceptEncoding: string | null): string | null {
    if (!acceptEncoding) return null

    const encodings = acceptEncoding
      .toLowerCase()
      .split(',')
      .map(e => e.trim().split(';')[0]) // Remove quality values
      .filter(e => e.length > 0)

    // Prefer gzip over deflate
    if (encodings.includes('gzip')) return 'gzip'
    if (encodings.includes('deflate')) return 'deflate'
    
    return null
  }

  /**
   * Enhanced JSON response with automatic compression and caching headers
   */
  static async createOptimizedResponse(
    data: unknown,
    request: Request,
    options: {
      compression?: CompressionOptions
      cache?: {
        maxAge?: number      // Browser cache in seconds
        sMaxAge?: number     // CDN cache in seconds
        staleWhileRevalidate?: number // SWR in seconds
      }
      etag?: string
    } = {}
  ): Promise<NextResponse> {
    const { compression, cache, etag } = options
    
    // Get Accept-Encoding from request
    const acceptEncoding = request.headers.get('accept-encoding')
    
    // Compress response
    const response = await this.compressResponse(data, acceptEncoding, compression)
    
    // Add cache headers if specified
    if (cache) {
      const cacheDirectives: string[] = ['public']
      
      if (cache.maxAge !== undefined) {
        cacheDirectives.push(`max-age=${cache.maxAge}`)
      }
      
      if (cache.sMaxAge !== undefined) {
        cacheDirectives.push(`s-maxage=${cache.sMaxAge}`)
      }
      
      if (cache.staleWhileRevalidate !== undefined) {
        cacheDirectives.push(`stale-while-revalidate=${cache.staleWhileRevalidate}`)
      }
      
      response.headers.set('Cache-Control', cacheDirectives.join(', '))
    }
    
    // Add ETag if specified
    if (etag) {
      response.headers.set('ETag', `"${etag}"`)
    }
    
    // Add performance headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Optimized', 'true')
    
    return response
  }
}

/**
 * Utility function to create an ETag from data
 */
export async function generateETag(data: unknown): Promise<string> {
  const crypto = await import('crypto')
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex')
  return hash.substring(0, 16) // Shorter ETag for efficiency
}

/**
 * Check if request has matching ETag (304 Not Modified)
 */
export function checkETag(request: Request, etag: string): boolean {
  const ifNoneMatch = request.headers.get('if-none-match')
  return ifNoneMatch === `"${etag}"`
}

// Light-weight version for routes that don't need compression
export class LightResponseUtils {
  static json(data: unknown, options: {
    status?: number
    headers?: Record<string, string>
  } = {}): NextResponse {
    const { status = 200, headers = {} } = options
    
    return NextResponse.json(data, {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        ...headers
      }
    })
  }
}