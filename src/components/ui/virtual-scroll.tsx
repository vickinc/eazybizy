/**
 * Virtual Scrolling Components
 * 
 * High-performance virtual scrolling implementation for handling
 * large datasets with minimal DOM nodes and memory usage.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FixedSizeList as List, VariableSizeList, ListChildComponentProps } from 'react-window';
import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';
import { LoadingSpinner, Skeleton } from './loading-states';
import { cn } from '@/utils/cn';

/**
 * Virtual List Component for uniform item heights
 */
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
  height?: number;
  onItemsRendered?: (startIndex: number, endIndex: number) => void;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  className,
  height = 400,
  onItemsRendered,
  loading = false,
  loadingComponent,
  emptyComponent,
  overscan = 5
}: VirtualListProps<T>) {
  const Row = ({ index, style }: ListChildComponentProps) => {
    const item = items[index];
    return (
      <div style={style}>
        {renderItem(item, index, style)}
      </div>
    );
  };

  if (loading && loadingComponent) {
    return <div className={className}>{loadingComponent}</div>;
  }

  if (items.length === 0 && emptyComponent) {
    return <div className={className}>{emptyComponent}</div>;
  }

  return (
    <div className={cn('virtual-list', className)} style={{ height }}>
      <AutoSizer>
        {({ height: autoHeight, width }) => (
          <List
            height={autoHeight}
            width={width}
            itemCount={items.length}
            itemSize={itemHeight}
            onItemsRendered={onItemsRendered}
            overscanCount={overscan}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}

/**
 * Virtual List with Variable Heights
 */
interface VariableVirtualListProps<T> {
  items: T[];
  getItemHeight: (index: number) => number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
  height?: number;
  estimatedItemHeight?: number;
  onItemsRendered?: (startIndex: number, endIndex: number) => void;
}

export function VariableVirtualList<T>({
  items,
  getItemHeight,
  renderItem,
  className,
  height = 400,
  estimatedItemHeight = 50,
  onItemsRendered
}: VariableVirtualListProps<T>) {
  const Row = ({ index, style }: ListChildComponentProps) => {
    const item = items[index];
    return (
      <div style={style}>
        {renderItem(item, index, style)}
      </div>
    );
  };

  return (
    <div className={cn('variable-virtual-list', className)} style={{ height }}>
      <AutoSizer>
        {({ height: autoHeight, width }) => (
          <VariableSizeList
            height={autoHeight}
            width={width}
            itemCount={items.length}
            itemSize={getItemHeight}
            estimatedItemSize={estimatedItemHeight}
            onItemsRendered={onItemsRendered}
          >
            {Row}
          </VariableSizeList>
        )}
      </AutoSizer>
    </div>
  );
}

/**
 * Infinite Loading Virtual List
 */
interface InfiniteVirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  hasNextPage: boolean;
  loadMoreItems: (startIndex: number, stopIndex: number) => Promise<void>;
  isLoading: boolean;
  className?: string;
  height?: number;
  threshold?: number;
  loadingComponent?: React.ReactNode;
}

export function InfiniteVirtualList<T>({
  items,
  itemHeight,
  renderItem,
  hasNextPage,
  loadMoreItems,
  isLoading,
  className,
  height = 400,
  threshold = 15,
  loadingComponent
}: InfiniteVirtualListProps<T>) {
  // Determine if an item is loaded
  const isItemLoaded = useCallback((index: number) => {
    return !!items[index];
  }, [items]);

  // Create item count including loading placeholders
  const itemCount = hasNextPage ? items.length + 1 : items.length;

  const Row = ({ index, style }: ListChildComponentProps) => {
    const item = items[index];
    
    // Show loading placeholder if item doesn't exist
    if (!item) {
      return (
        <div style={style} className="flex items-center justify-center">
          {loadingComponent || <LoadingSpinner size="sm" />}
        </div>
      );
    }

    return (
      <div style={style}>
        {renderItem(item, index, style)}
      </div>
    );
  };

  return (
    <div className={cn('infinite-virtual-list', className)} style={{ height }}>
      <AutoSizer>
        {({ height: autoHeight, width }) => (
          <InfiniteLoader
            isItemLoaded={isItemLoaded}
            itemCount={itemCount}
            loadMoreItems={loadMoreItems}
            threshold={threshold}
          >
            {({ onItemsRendered, ref }) => (
              <List
                ref={ref}
                height={autoHeight}
                width={width}
                itemCount={itemCount}
                itemSize={itemHeight}
                onItemsRendered={onItemsRendered}
              >
                {Row}
              </List>
            )}
          </InfiniteLoader>
        )}
      </AutoSizer>
    </div>
  );
}

/**
 * Virtual Grid Component
 */
interface VirtualGridProps<T> {
  items: T[];
  columnCount: number;
  rowHeight: number;
  columnWidth: number;
  renderCell: (item: T, rowIndex: number, columnIndex: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
  height?: number;
}

export function VirtualGrid<T>({
  items,
  columnCount,
  rowHeight,
  columnWidth,
  renderCell,
  className,
  height = 400
}: VirtualGridProps<T>) {
  const rowCount = Math.ceil(items.length / columnCount);

  const Cell = ({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
    const index = rowIndex * columnCount + columnIndex;
    const item = items[index];
    
    if (!item) {
      return <div style={style} />;
    }

    return (
      <div style={style}>
        {renderCell(item, rowIndex, columnIndex, style)}
      </div>
    );
  };

  return (
    <div className={cn('virtual-grid', className)} style={{ height }}>
      <AutoSizer>
        {({ height: autoHeight, width }) => (
          <Grid
            height={autoHeight}
            width={width}
            rowCount={rowCount}
            columnCount={columnCount}
            rowHeight={rowHeight}
            columnWidth={columnWidth}
          >
            {Cell}
          </Grid>
        )}
      </AutoSizer>
    </div>
  );
}

/**
 * Virtual Table Component
 */
interface VirtualTableColumn<T> {
  key: string;
  header: string;
  width: number;
  render: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface VirtualTableProps<T> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  rowHeight?: number;
  headerHeight?: number;
  className?: string;
  height?: number;
  onRowClick?: (item: T, index: number) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function VirtualTable<T>({
  data,
  columns,
  rowHeight = 50,
  headerHeight = 40,
  className,
  height = 400,
  onRowClick,
  loading = false,
  emptyMessage = 'No data available'
}: VirtualTableProps<T>) {
  const Row = ({ index, style }: ListChildComponentProps) => {
    const item = data[index];
    
    return (
      <div 
        style={style} 
        className={cn(
          'virtual-table-row border-b border-gray-200 flex items-center hover:bg-gray-50',
          onRowClick && 'cursor-pointer'
        )}
        onClick={() => onRowClick?.(item, index)}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(
              'px-4 py-2 truncate',
              column.align === 'center' && 'text-center',
              column.align === 'right' && 'text-right'
            )}
            style={{ width: column.width }}
          >
            {column.render(item, index)}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={cn('virtual-table', className)} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner text="Loading table data..." />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('virtual-table', className)} style={{ height }}>
        <div className="flex items-center justify-center h-full text-gray-500">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('virtual-table border border-gray-200 rounded-lg', className)}>
      {/* Table Header */}
      <div 
        className="virtual-table-header bg-gray-50 border-b border-gray-200 flex items-center font-medium"
        style={{ height: headerHeight }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(
              'px-4 py-2 truncate',
              column.align === 'center' && 'text-center',
              column.align === 'right' && 'text-right'
            )}
            style={{ width: column.width }}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Virtual List */}
      <div style={{ height: height - headerHeight }}>
        <AutoSizer>
          {({ height: autoHeight, width }) => (
            <List
              height={autoHeight}
              width={width}
              itemCount={data.length}
              itemSize={rowHeight}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}

/**
 * Custom Hook for Virtual Scrolling
 */
interface UseVirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualScroll<T>(
  items: T[],
  options: UseVirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex + 1),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscan]);

  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    onScroll,
    scrollTop
  };
}

/**
 * Specialized Virtual Components for App Use Cases
 */

// Virtual Invoice List
export const VirtualInvoiceList: React.FC<{
  invoices: any[];
  onInvoiceClick?: (invoice: any) => void;
  height?: number;
  loading?: boolean;
}> = ({ invoices, onInvoiceClick, height = 400, loading }) => {
  const renderInvoice = (invoice: any, index: number, style: React.CSSProperties) => (
    <div 
      className="border-b border-gray-200 p-4 hover:bg-gray-50 cursor-pointer"
      onClick={() => onInvoiceClick?.(invoice)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{invoice.invoiceNumber}</h3>
          <p className="text-gray-600">{invoice.clientName}</p>
          <p className="text-sm text-gray-500">{invoice.issueDate}</p>
        </div>
        <div className="text-right">
          <p className="font-medium">{invoice.currency} {invoice.totalAmount}</p>
          <span className={cn(
            'inline-block px-2 py-1 rounded-full text-xs',
            invoice.status === 'PAID' && 'bg-green-100 text-green-800',
            invoice.status === 'SENT' && 'bg-blue-100 text-blue-800',
            invoice.status === 'DRAFT' && 'bg-gray-100 text-gray-800',
            invoice.status === 'OVERDUE' && 'bg-red-100 text-red-800'
          )}>
            {invoice.status}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <VirtualList
      items={invoices}
      itemHeight={100}
      renderItem={renderInvoice}
      height={height}
      loading={loading}
      loadingComponent={
        <div className="space-y-4 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      }
      emptyComponent={
        <div className="flex items-center justify-center h-full text-gray-500">
          No invoices found
        </div>
      }
    />
  );
};

// Virtual Client List
export const VirtualClientList: React.FC<{
  clients: any[];
  onClientClick?: (client: any) => void;
  height?: number;
  loading?: boolean;
}> = ({ clients, onClientClick, height = 400, loading }) => {
  const renderClient = (client: any, index: number, style: React.CSSProperties) => (
    <div 
      className="border-b border-gray-200 p-4 hover:bg-gray-50 cursor-pointer"
      onClick={() => onClientClick?.(client)}
    >
      <div className="flex items-center space-x-4">
        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-medium">
            {client.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="font-medium">{client.name}</h3>
          <p className="text-gray-600">{client.email}</p>
          <p className="text-sm text-gray-500">{client.industry}</p>
        </div>
        <div className="text-right">
          <span className={cn(
            'inline-block px-2 py-1 rounded-full text-xs',
            client.status === 'ACTIVE' && 'bg-green-100 text-green-800',
            client.status === 'INACTIVE' && 'bg-gray-100 text-gray-800'
          )}>
            {client.status}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <VirtualList
      items={clients}
      itemHeight={80}
      renderItem={renderClient}
      height={height}
      loading={loading}
      loadingComponent={
        <div className="space-y-4 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      }
      emptyComponent={
        <div className="flex items-center justify-center h-full text-gray-500">
          No clients found
        </div>
      }
    />
  );
};

export default {
  VirtualList,
  VariableVirtualList,
  InfiniteVirtualList,
  VirtualGrid,
  VirtualTable,
  VirtualInvoiceList,
  VirtualClientList,
  useVirtualScroll
};