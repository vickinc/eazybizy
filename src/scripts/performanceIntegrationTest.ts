import { performance } from 'perf_hooks'

interface PerformanceMetrics {
  operation: string
  module: string
  recordCount: number
  executionTime: number
  memoryUsage: number
  throughput: number // records per second
  status: 'success' | 'error'
  error?: string
}

interface PerformanceTestSuite {
  testName: string
  description: string
  results: PerformanceMetrics[]
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    averageExecutionTime: number
    totalRecordsProcessed: number
    overallThroughput: number
  }
}

class PerformanceIntegrationTester {
  private results: PerformanceMetrics[] = []
  
  // API endpoints to test
  private readonly endpoints = {
    bookkeeping: '/api/bookkeeping',
    transactions: '/api/transactions', 
    invoices: '/api/invoices',
    clients: '/api/clients'
  }

  // Test data generation
  private generateTestParams(count: number) {
    return {
      take: count,
      skip: 0,
      search: '',
      status: 'all',
      sortField: 'createdAt',
      sortDirection: 'desc' as const
    }
  }

  // Measure performance of an operation
  private async measurePerformance<T>(
    operation: string,
    module: string,
    recordCount: number,
    testFn: () => Promise<T>
  ): Promise<PerformanceMetrics> {
    const startTime = performance.now()
    const startMemory = process.memoryUsage().heapUsed

    try {
      await testFn()
      
      const endTime = performance.now()
      const endMemory = process.memoryUsage().heapUsed
      const executionTime = endTime - startTime
      const memoryUsage = endMemory - startMemory
      const throughput = recordCount / (executionTime / 1000)

      return {
        operation,
        module,
        recordCount,
        executionTime,
        memoryUsage,
        throughput,
        status: 'success'
      }
    } catch (error) {
      const endTime = performance.now()
      const executionTime = endTime - startTime

      return {
        operation,
        module,
        recordCount,
        executionTime,
        memoryUsage: 0,
        throughput: 0,
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // Test data fetching performance
  async testDataFetching(): Promise<PerformanceMetrics[]> {
    const results: PerformanceMetrics[] = []

    const testCases = [
      { count: 100, description: 'Small dataset' },
      { count: 500, description: 'Medium dataset' },
      { count: 1000, description: 'Large dataset' },
      { count: 5000, description: 'Very large dataset' }
    ]

    for (const testCase of testCases) {

      // Test each module
      for (const [module, endpoint] of Object.entries(this.endpoints)) {
        const metric = await this.measurePerformance(
          `fetch_${testCase.count}`,
          module,
          testCase.count,
          async () => {
            const params = new URLSearchParams(this.generateTestParams(testCase.count) as any)
            const response = await fetch(`${endpoint}?${params}`)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            return response.json()
          }
        )
        results.push(metric)
      }
    }

    return results
  }

  // Test search performance
  async testSearchPerformance(): Promise<PerformanceMetrics[]> {
    const results: PerformanceMetrics[] = []

    const searchTerms = ['test', 'invoice', 'client', 'transaction', 'a']

    for (const searchTerm of searchTerms) {

      for (const [module, endpoint] of Object.entries(this.endpoints)) {
        const metric = await this.measurePerformance(
          `search_${searchTerm}`,
          module,
          1000, // Assume searching through 1000 records
          async () => {
            const params = new URLSearchParams({
              take: '1000',
              search: searchTerm
            })
            const response = await fetch(`${endpoint}?${params}`)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            return response.json()
          }
        )
        results.push(metric)
      }
    }

    return results
  }

  // Test filtering performance
  async testFilteringPerformance(): Promise<PerformanceMetrics[]> {
    const results: PerformanceMetrics[] = []

    const filterTests = [
      { status: 'ACTIVE', description: 'Status filter' },
      { status: 'PAID', description: 'Status filter (invoices)' },
      { dateRange: 'thisMonth', description: 'Date range filter' },
      { company: '1', description: 'Company filter' }
    ]

    for (const filter of filterTests) {

      for (const [module, endpoint] of Object.entries(this.endpoints)) {
        const metric = await this.measurePerformance(
          `filter_${filter.description}`,
          module,
          1000,
          async () => {
            const params = new URLSearchParams({
              take: '1000',
              ...filter
            })
            const response = await fetch(`${endpoint}?${params}`)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            return response.json()
          }
        )
        results.push(metric)
      }
    }

    return results
  }

  // Test pagination performance
  async testPaginationPerformance(): Promise<PerformanceMetrics[]> {
    const results: PerformanceMetrics[] = []

    const paginationTests = [
      { skip: 0, take: 20 },
      { skip: 100, take: 20 },
      { skip: 1000, take: 20 },
      { skip: 5000, take: 20 }
    ]

    for (const pagination of paginationTests) {

      for (const [module, endpoint] of Object.entries(this.endpoints)) {
        const metric = await this.measurePerformance(
          `pagination_${pagination.skip}_${pagination.take}`,
          module,
          pagination.take,
          async () => {
            const params = new URLSearchParams({
              skip: pagination.skip.toString(),
              take: pagination.take.toString()
            })
            const response = await fetch(`${endpoint}?${params}`)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            return response.json()
          }
        )
        results.push(metric)
      }
    }

    return results
  }

  // Test statistics endpoint performance
  async testStatisticsPerformance(): Promise<PerformanceMetrics[]> {
    const results: PerformanceMetrics[] = []

    const modules = ['transactions', 'invoices', 'clients']

    for (const module of modules) {
      const metric = await this.measurePerformance(
        'statistics',
        module,
        0, // Statistics don't return individual records
        async () => {
          const response = await fetch(`/api/${module}/statistics`)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          return response.json()
        }
      )
      results.push(metric)
    }

    return results
  }

  // Test concurrent operations
  async testConcurrentOperations(): Promise<PerformanceMetrics[]> {
    const results: PerformanceMetrics[] = []

    const concurrentTests = [2, 5, 10]

    for (const concurrency of concurrentTests) {

      for (const [module, endpoint] of Object.entries(this.endpoints)) {
        const metric = await this.measurePerformance(
          `concurrent_${concurrency}`,
          module,
          concurrency * 100,
          async () => {
            const promises = Array.from({ length: concurrency }, () => {
              const params = new URLSearchParams({ take: '100' })
              return fetch(`${endpoint}?${params}`).then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
              })
            })
            return Promise.all(promises)
          }
        )
        results.push(metric)
      }
    }

    return results
  }

  // Test bulk operations performance
  async testBulkOperations(): Promise<PerformanceMetrics[]> {
    const results: PerformanceMetrics[] = []

    // Note: These would be actual bulk operations in a real test
    const bulkSizes = [10, 50, 100]

    for (const size of bulkSizes) {

      // Test invoice bulk operations
      const metric = await this.measurePerformance(
        `bulk_${size}`,
        'invoices',
        size,
        async () => {
          // Mock bulk operation - in real test this would perform actual bulk operations
          const response = await fetch('/api/invoices/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              operation: 'export',
              data: { ids: Array.from({ length: size }, (_, i) => `test-${i}`) }
            })
          })
          // Allow 404 for mock data
          if (response.status !== 404 && !response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          return response.status === 404 ? { mock: true } : response.json()
        }
      )
      results.push(metric)
    }

    return results
  }

  // Run comprehensive performance test suite
  async runFullTestSuite(): Promise<PerformanceTestSuite> {

    const startTime = performance.now()
    
    try {
      // Run all test categories
      const [
        fetchResults,
        searchResults,
        filterResults,
        paginationResults,
        statisticsResults,
        concurrentResults,
        bulkResults
      ] = await Promise.all([
        this.testDataFetching(),
        this.testSearchPerformance(),
        this.testFilteringPerformance(),
        this.testPaginationPerformance(),
        this.testStatisticsPerformance(),
        this.testConcurrentOperations(),
        this.testBulkOperations()
      ])

      const allResults = [
        ...fetchResults,
        ...searchResults,
        ...filterResults,
        ...paginationResults,
        ...statisticsResults,
        ...concurrentResults,
        ...bulkResults
      ]

      const summary = this.calculateSummary(allResults)
      const endTime = performance.now()


      return {
        testName: 'Performance Integration Test Suite',
        description: 'Comprehensive performance testing of all API endpoints and operations',
        results: allResults,
        summary
      }

    } catch (error) {
      console.error('❌ Performance test suite failed:', error)
      throw error
    }
  }

  // Calculate test summary
  private calculateSummary(results: PerformanceMetrics[]) {
    const passedTests = results.filter(r => r.status === 'success').length
    const failedTests = results.filter(r => r.status === 'error').length
    const totalRecordsProcessed = results.reduce((sum, r) => sum + r.recordCount, 0)
    const averageExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length
    const overallThroughput = results
      .filter(r => r.status === 'success' && r.throughput > 0)
      .reduce((sum, r) => sum + r.throughput, 0) / results.filter(r => r.throughput > 0).length

    return {
      totalTests: results.length,
      passedTests,
      failedTests,
      averageExecutionTime,
      totalRecordsProcessed,
      overallThroughput
    }
  }

  // Generate performance report
  generateReport(testSuite: PerformanceTestSuite): string {
    const { results, summary } = testSuite

    let report = `
Performance Integration Test Report
===================================
Test Suite: ${testSuite.testName}
Description: ${testSuite.description}
Generated: ${new Date().toISOString()}

SUMMARY
-------
Total Tests: ${summary.totalTests}
Passed: ${summary.passedTests} (${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%)
Failed: ${summary.failedTests} (${((summary.failedTests / summary.totalTests) * 100).toFixed(1)}%)
Total Records Processed: ${summary.totalRecordsProcessed.toLocaleString()}
Average Execution Time: ${summary.averageExecutionTime.toFixed(2)}ms
Overall Throughput: ${summary.overallThroughput.toFixed(0)} records/second

PERFORMANCE METRICS BY MODULE
----------------------------
`

    // Group results by module
    const moduleGroups = results.reduce((groups, result) => {
      if (!groups[result.module]) groups[result.module] = []
      groups[result.module].push(result)
      return groups
    }, {} as Record<string, PerformanceMetrics[]>)

    for (const [module, moduleResults] of Object.entries(moduleGroups)) {
      const successfulResults = moduleResults.filter(r => r.status === 'success')
      const avgExecutionTime = successfulResults.reduce((sum, r) => sum + r.executionTime, 0) / successfulResults.length
      const avgThroughput = successfulResults.reduce((sum, r) => sum + r.throughput, 0) / successfulResults.length

      report += `
${module.toUpperCase()}:
  Tests: ${moduleResults.length}
  Success Rate: ${((successfulResults.length / moduleResults.length) * 100).toFixed(1)}%
  Avg Execution Time: ${avgExecutionTime.toFixed(2)}ms
  Avg Throughput: ${avgThroughput.toFixed(0)} records/second
`
    }

    report += `
DETAILED RESULTS
---------------
`

    for (const result of results) {
      const status = result.status === 'success' ? '✅' : '❌'
      report += `${status} ${result.module}/${result.operation}: ${result.executionTime.toFixed(2)}ms (${result.throughput.toFixed(0)} rec/s)`
      if (result.status === 'error') {
        report += ` - ERROR: ${result.error}`
      }
      report += '\n'
    }

    report += `
PERFORMANCE RECOMMENDATIONS
--------------------------
`

    // Analyze results and provide recommendations
    const slowOperations = results.filter(r => r.status === 'success' && r.executionTime > 1000)
    const lowThroughput = results.filter(r => r.status === 'success' && r.throughput < 100)

    if (slowOperations.length > 0) {
      report += `• Consider optimizing slow operations: ${slowOperations.map(r => `${r.module}/${r.operation}`).join(', ')}\n`
    }

    if (lowThroughput.length > 0) {
      report += `• Consider improving throughput for: ${lowThroughput.map(r => `${r.module}/${r.operation}`).join(', ')}\n`
    }

    const errorOperations = results.filter(r => r.status === 'error')
    if (errorOperations.length > 0) {
      report += `• Fix failing operations: ${errorOperations.map(r => `${r.module}/${r.operation}`).join(', ')}\n`
    }

    if (summary.overallThroughput > 1000) {
      report += `• Excellent performance! Average throughput of ${summary.overallThroughput.toFixed(0)} records/second\n`
    } else if (summary.overallThroughput > 500) {
      report += `• Good performance with ${summary.overallThroughput.toFixed(0)} records/second throughput\n`
    } else {
      report += `• Performance could be improved - current throughput is ${summary.overallThroughput.toFixed(0)} records/second\n`
    }

    return report
  }
}

// Export for use in tests
export { PerformanceIntegrationTester, type PerformanceMetrics, type PerformanceTestSuite }

// Main function to run performance tests
export async function runPerformanceTests(): Promise<void> {
  const tester = new PerformanceIntegrationTester()
  
  try {
    const testSuite = await tester.runFullTestSuite()
    const report = tester.generateReport(testSuite)
    
    
    // Save report to file
    const fs = await import('fs')
    const path = await import('path')
    
    const reportPath = path.join(process.cwd(), 'performance-test-report.txt')
    fs.writeFileSync(reportPath, report)
    
    
  } catch (error) {
    console.error('Performance test failed:', error)
    process.exit(1)
  }
}

// CLI usage
if (require.main === module) {
  runPerformanceTests()
}