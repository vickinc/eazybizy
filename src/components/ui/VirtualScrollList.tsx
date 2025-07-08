import React, { useState, useEffect, useRef, useCallback } from 'react'

export interface VirtualScrollItem {
  id: string
  [key: string]: any
}

interface VirtualScrollListProps<T extends VirtualScrollItem> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  onLoadMore?: () => void
  hasMore?: boolean
  isLoading?: boolean
  loadingComponent?: React.ReactNode
  className?: string
}

export function VirtualScrollList<T extends VirtualScrollItem>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  loadingComponent,
  className = '',
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  // Calculate total height and visible items
  const totalHeight = items.length * itemHeight
  const visibleItems = items.slice(startIndex, endIndex + 1)

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    setScrollTop(scrollTop)

    // Trigger load more when near bottom
    if (
      onLoadMore &&
      hasMore &&
      !isLoading &&
      scrollTop + containerHeight >= totalHeight - itemHeight * 5
    ) {
      onLoadMore()
    }
  }, [onLoadMore, hasMore, isLoading, totalHeight, containerHeight, itemHeight])

  // Auto-scroll to load more content if needed
  useEffect(() => {
    if (items.length < 20 && hasMore && !isLoading && onLoadMore) {
      onLoadMore()
    }
  }, [items.length, hasMore, isLoading, onLoadMore])

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Spacer before visible items */}
        <div style={{ height: startIndex * itemHeight }} />
        
        {/* Visible items */}
        {visibleItems.map((item, index) => (
          <div
            key={item.id}
            style={{
              height: itemHeight,
              overflow: 'hidden',
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div style={{ height: itemHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {loadingComponent || (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Loading more...</span>
              </div>
            )}
          </div>
        )}
        
        {/* End of list indicator */}
        {!hasMore && items.length > 0 && (
          <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="text-sm text-gray-500">No more items</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Specialized component for bookkeeping entries
export interface BookkeepingEntryVirtualListProps {
  entries: any[]
  onEntryClick?: (entry: any) => void
  onEntryEdit?: (entry: any) => void
  onEntryDelete?: (entryId: string) => void
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  className?: string
}

export function BookkeepingEntryVirtualList({
  entries,
  onEntryClick,
  onEntryEdit,
  onEntryDelete,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  className = '',
}: BookkeepingEntryVirtualListProps) {
  const renderEntry = useCallback((entry: any, index: number) => (
    <div className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            {/* Type indicator */}
            <div className={`w-2 h-2 rounded-full ${
              entry.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            
            {/* Entry details */}
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {entry.description}
                </p>
                <span className={`text-sm font-semibold ${
                  entry.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {entry.type === 'INCOME' ? '+' : '-'}
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: entry.currency,
                  }).format(entry.amount)}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-xs text-gray-500">
                  {entry.category}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(entry.date).toLocaleDateString()}
                </p>
                {entry.reference && (
                  <p className="text-xs text-gray-500">
                    Ref: {entry.reference}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-2">
          {onEntryEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEntryEdit(entry)
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit
            </button>
          )}
          {onEntryDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEntryDelete(entry.id)
              }}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  ), [onEntryEdit, onEntryDelete])

  return (
    <VirtualScrollList
      items={entries}
      itemHeight={80}
      containerHeight={600}
      renderItem={renderEntry}
      onLoadMore={onLoadMore}
      hasMore={hasMore}
      isLoading={isLoading}
      className={className}
    />
  )
}

// Specialized component for transactions
export interface TransactionVirtualListProps {
  transactions: any[]
  onTransactionClick?: (transaction: any) => void
  onTransactionEdit?: (transaction: any) => void
  onTransactionDelete?: (transactionId: string) => void
  onTransactionSelect?: (transactionId: string) => void
  selectedTransactions?: Set<string>
  expandedTransactions?: Set<string>
  onTransactionExpand?: (transactionId: string) => void
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  formatCurrency?: (amount: number, currency?: string) => string
  getAccountName?: (transaction: any) => string
  getCashFlowDirection?: (transaction: any) => 'incoming' | 'outgoing' | 'neutral'
  className?: string
}

export function TransactionVirtualList({
  transactions,
  onTransactionClick,
  onTransactionEdit,
  onTransactionDelete,
  onTransactionSelect,
  selectedTransactions = new Set(),
  expandedTransactions = new Set(),
  onTransactionExpand,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  formatCurrency = (amount, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount),
  getAccountName = (transaction) => transaction.companyAccount?.name || transaction.bankAccount?.accountName || transaction.digitalWallet?.walletName || 'Unknown Account',
  getCashFlowDirection = (transaction) => {
    if ((transaction.incomingAmount || 0) > 0) return 'incoming'
    if ((transaction.outgoingAmount || 0) > 0) return 'outgoing'
    return 'neutral'
  },
  className = '',
}: TransactionVirtualListProps) {
  const renderTransaction = useCallback((transaction: any, index: number) => {
    const isSelected = selectedTransactions.has(transaction.id)
    const isExpanded = expandedTransactions.has(transaction.id)
    const direction = getCashFlowDirection(transaction)
    const accountName = getAccountName(transaction)

    return (
      <div
        className={`border-b border-gray-200 transition-colors ${
          isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
        }`}
        onClick={() => onTransactionClick?.(transaction)}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Selection and main info */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Selection checkbox */}
              {onTransactionSelect && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation()
                    onTransactionSelect(transaction.id)
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              )}

              {/* Cash flow indicator */}
              <div className={`w-3 h-3 rounded-full ${
                direction === 'incoming' ? 'bg-green-500' : 
                direction === 'outgoing' ? 'bg-red-500' : 'bg-gray-400'
              }`} />

              {/* Transaction details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 min-w-0 flex-1">
                    {/* Date */}
                    <p className="text-sm text-gray-500 flex-shrink-0">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                    
                    {/* From/To */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.paidBy} → {transaction.paidTo}
                      </p>
                      {transaction.description && (
                        <p className="text-xs text-gray-500 truncate">
                          {transaction.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${
                      direction === 'incoming' ? 'text-green-600' : 
                      direction === 'outgoing' ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {direction === 'incoming' ? '+' : direction === 'outgoing' ? '-' : ''}
                      {formatCurrency(Math.abs(transaction.netAmount), transaction.currency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {accountName}
                    </p>
                  </div>
                </div>

                {/* Secondary info row */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-4">
                    {transaction.category && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {transaction.category}
                      </span>
                    )}
                    {transaction.reference && (
                      <span className="text-xs text-gray-500">
                        Ref: {transaction.reference}
                      </span>
                    )}
                    {transaction.status !== 'CLEARED' && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        transaction.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.status}
                      </span>
                    )}
                    {transaction.reconciliationStatus !== 'RECONCILED' && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.reconciliationStatus === 'UNRECONCILED' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.reconciliationStatus === 'UNRECONCILED' ? 'Unreconciled' : transaction.reconciliationStatus}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {onTransactionExpand && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onTransactionExpand(transaction.id)
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                      >
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </button>
                    )}
                    {onTransactionEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onTransactionEdit(transaction)
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                    )}
                    {onTransactionDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onTransactionDelete(transaction.id)
                        }}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-gray-500">Account Type</p>
                        <p className="font-medium">{transaction.accountType}</p>
                      </div>
                      {transaction.linkedEntry && (
                        <div>
                          <p className="text-gray-500">Linked Entry</p>
                          <p className="font-medium">{transaction.linkedEntry.description}</p>
                        </div>
                      )}
                      {transaction.notes && (
                        <div className="col-span-2">
                          <p className="text-gray-500">Notes</p>
                          <p className="font-medium">{transaction.notes}</p>
                        </div>
                      )}
                      {transaction.tags && transaction.tags.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-gray-500">Tags</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {transaction.tags.map((tag: string, i: number) => (
                              <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }, [
    selectedTransactions, expandedTransactions, onTransactionClick, onTransactionSelect, 
    onTransactionExpand, onTransactionEdit, onTransactionDelete, formatCurrency, 
    getAccountName, getCashFlowDirection
  ])

  return (
    <VirtualScrollList
      items={transactions}
      itemHeight={120} // Slightly taller for transaction complexity
      containerHeight={600}
      renderItem={renderTransaction}
      onLoadMore={onLoadMore}
      hasMore={hasMore}
      isLoading={isLoading}
      className={className}
    />
  )
}