/**
 * Loading States Components
 * 
 * Comprehensive collection of loading components including skeletons,
 * spinners, and progress indicators for better perceived performance.
 */

import React from 'react';
import { Loader2, RefreshCw, Download, Upload } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Generic Loading Spinner
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  text 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={cn('animate-spin text-blue-600', sizeClasses[size])} />
        {text && (
          <span className="text-sm text-gray-600 animate-pulse">{text}</span>
        )}
      </div>
    </div>
  );
};

/**
 * Page Loading Component
 */
export const PageLoading: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => (
  <div className="min-h-screen bg-lime-50 flex items-center justify-center">
    <div className="text-center space-y-4">
      <LoadingSpinner size="xl" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">{message}</h2>
        <p className="text-gray-600">Please wait while we load your data</p>
      </div>
    </div>
  </div>
);

/**
 * Section Loading Component
 */
export const SectionLoading: React.FC<{ 
  message?: string;
  height?: string;
  className?: string;
}> = ({ 
  message = 'Loading section...', 
  height = 'h-64',
  className 
}) => (
  <div className={cn('flex items-center justify-center bg-white rounded-lg border', height, className)}>
    <LoadingSpinner text={message} />
  </div>
);

/**
 * Skeleton Components
 */
export const Skeleton: React.FC<{ 
  className?: string;
  animate?: boolean;
}> = ({ 
  className, 
  animate = true 
}) => (
  <div className={cn(
    'bg-gray-200 rounded',
    animate && 'animate-pulse',
    className
  )} />
);

/**
 * Table Skeleton
 */
export const TableSkeleton: React.FC<{ 
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}> = ({ 
  rows = 5, 
  columns = 4, 
  showHeader = true 
}) => (
  <div className="space-y-4">
    {showHeader && (
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-6" />
        ))}
      </div>
    )}
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-4 gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

/**
 * Card Skeleton
 */
export const CardSkeleton: React.FC<{ 
  showImage?: boolean;
  lines?: number;
}> = ({ 
  showImage = false, 
  lines = 3 
}) => (
  <div className="border rounded-lg p-6 space-y-4">
    {showImage && <Skeleton className="h-48 w-full" />}
    <div className="space-y-2">
      <Skeleton className="h-6 w-3/4" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn(
          'h-4',
          i === lines - 1 ? 'w-1/2' : 'w-full'
        )} />
      ))}
    </div>
    <div className="flex space-x-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

/**
 * List Item Skeleton
 */
export const ListItemSkeleton: React.FC = () => (
  <div className="flex items-center space-x-4 p-4 border-b">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-8 w-16" />
  </div>
);

/**
 * Form Skeleton
 */
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 6 }) => (
  <div className="space-y-6">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex space-x-2">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

/**
 * Stats Card Skeleton
 */
export const StatsCardSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-lg border space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-8 w-8 rounded" />
    </div>
    <Skeleton className="h-8 w-20" />
    <div className="flex items-center space-x-2">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
);

/**
 * Chart Skeleton
 */
export const ChartSkeleton: React.FC<{ height?: string }> = ({ 
  height = 'h-64' 
}) => (
  <div className={cn('bg-white rounded-lg border p-6', height)}>
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex items-end space-x-2 h-40">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1" 
            style={{ height: `${Math.random() * 80 + 20}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-8" />
        ))}
      </div>
    </div>
  </div>
);

/**
 * Progress Loading Component
 */
interface ProgressLoadingProps {
  progress: number;
  message?: string;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressLoading: React.FC<ProgressLoadingProps> = ({
  progress,
  message = 'Loading...',
  showPercentage = true,
  className
}) => (
  <div className={cn('space-y-4', className)}>
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-gray-700">{message}</span>
      {showPercentage && (
        <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
      )}
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  </div>
);

/**
 * Inline Loading Component
 */
export const InlineLoading: React.FC<{ 
  text?: string;
  icon?: 'spinner' | 'refresh' | 'download' | 'upload';
  size?: 'sm' | 'md';
}> = ({ 
  text = 'Loading...', 
  icon = 'spinner',
  size = 'sm'
}) => {
  const IconComponent = {
    spinner: Loader2,
    refresh: RefreshCw,
    download: Download,
    upload: Upload
  }[icon];

  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className="inline-flex items-center space-x-2">
      <IconComponent className={cn('animate-spin text-blue-600', sizeClass)} />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
};

/**
 * Button Loading State
 */
export const ButtonLoading: React.FC<{ 
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  className?: string;
}> = ({ 
  children, 
  loading = false, 
  loadingText,
  className 
}) => (
  <button 
    className={cn(
      'inline-flex items-center justify-center space-x-2',
      loading && 'pointer-events-none opacity-75',
      className
    )}
    disabled={loading}
  >
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    <span>{loading && loadingText ? loadingText : children}</span>
  </button>
);

/**
 * Data Loading States for specific use cases
 */

// Invoice List Loading
export const InvoiceListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="border rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-20 rounded-full" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Client List Loading
export const ClientListSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    ))}
  </div>
);

// Transaction List Loading
export const TransactionListSkeleton: React.FC = () => (
  <div className="space-y-2">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3 flex-1">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="space-y-1 text-right">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ))}
  </div>
);

export default {
  LoadingSpinner,
  PageLoading,
  SectionLoading,
  Skeleton,
  TableSkeleton,
  CardSkeleton,
  ListItemSkeleton,
  FormSkeleton,
  StatsCardSkeleton,
  ChartSkeleton,
  ProgressLoading,
  InlineLoading,
  ButtonLoading,
  InvoiceListSkeleton,
  ClientListSkeleton,
  TransactionListSkeleton
};