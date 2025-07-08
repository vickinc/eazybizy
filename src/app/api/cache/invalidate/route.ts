import { NextRequest, NextResponse } from 'next/server'
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, companyId } = body

    let result = 0
    let message = ''

    switch (type) {
      case 'companies':
        result = await CacheInvalidationService.invalidateCompanies()
        message = `Invalidated ${result} company cache entries`
        break

      case 'company-lists':
        result = await CacheInvalidationService.invalidateCompanyLists()
        message = `Invalidated ${result} company list cache entries`
        break

      case 'company':
        if (!companyId) {
          return NextResponse.json(
            { error: 'Company ID required for specific company invalidation' },
            { status: 400 }
          )
        }
        const success = await CacheInvalidationService.invalidateCompany(companyId)
        message = success ? `Invalidated cache for company ${companyId}` : 'Failed to invalidate company cache'
        break

      case 'company-stats':
        const statsSuccess = await CacheInvalidationService.invalidateCompanyStats()
        message = statsSuccess ? 'Invalidated company statistics cache' : 'Failed to invalidate company statistics'
        break

      case 'search':
        result = await CacheInvalidationService.invalidateSearchCaches()
        message = `Invalidated ${result} search cache entries`
        break

      case 'calendar':
        result = await CacheInvalidationService.invalidateCalendar()
        message = `Invalidated ${result} calendar cache entries`
        break

      case 'notes':
        result = await CacheInvalidationService.invalidateNotes()
        message = `Invalidated ${result} notes cache entries`
        break

      case 'company-mutation':
        await CacheInvalidationService.invalidateOnCompanyMutation(companyId)
        message = 'Smart invalidation completed for company mutation'
        break

      case 'all':
        result = await CacheInvalidationService.clearAll()
        message = `Emergency cache clear: removed ${result} entries`
        break

      case 'warm-up':
        await CacheInvalidationService.warmUpCaches()
        message = 'Cache warm-up completed'
        break

      default:
        return NextResponse.json(
          { error: 'Invalid invalidation type. Valid types: companies, company-lists, company, company-stats, search, calendar, notes, company-mutation, all, warm-up' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message,
      type,
      companyId: companyId || null,
      deletedCount: result
    })

  } catch (error) {
    console.error('Cache invalidation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to invalidate cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Convenience GET endpoint for quick invalidations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'company-lists'

    let result = 0
    let message = ''

    switch (type) {
      case 'companies':
        result = await CacheInvalidationService.invalidateCompanies()
        message = `Invalidated ${result} company cache entries`
        break

      case 'company-lists':
        result = await CacheInvalidationService.invalidateCompanyLists()
        message = `Invalidated ${result} company list cache entries`
        break

      default:
        result = await CacheInvalidationService.invalidateCompanyLists()
        message = `Invalidated ${result} company list cache entries (default)`
        break
    }

    return NextResponse.json({
      success: true,
      message,
      type,
      deletedCount: result
    })

  } catch (error) {
    console.error('Cache invalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate cache' },
      { status: 500 }
    )
  }
}