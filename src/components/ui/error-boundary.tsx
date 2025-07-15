/**
 * Error Boundary Components
 * 
 * Comprehensive error handling components for catching and displaying
 * JavaScript errors in React component tree with graceful fallbacks.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Home from "lucide-react/dist/esm/icons/home";
import Bug from "lucide-react/dist/esm/icons/bug";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'section' | 'component';
}

/**
 * Main Error Boundary Component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary Caught Error (${this.state.errorId})`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // In production, you might want to log to an error reporting service
    // logErrorToService(error, errorInfo, this.state.errorId);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: ''
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback based on error level
      const { level = 'component' } = this.props;
      
      switch (level) {
        case 'page':
          return <PageErrorFallback 
            error={this.state.error} 
            errorId={this.state.errorId}
            onRetry={this.handleRetry}
            onGoHome={this.handleGoHome}
            showDetails={this.props.showDetails}
          />;
        
        case 'section':
          return <SectionErrorFallback 
            error={this.state.error}
            errorId={this.state.errorId}
            onRetry={this.handleRetry}
            showDetails={this.props.showDetails}
          />;
        
        default:
          return <ComponentErrorFallback 
            error={this.state.error}
            errorId={this.state.errorId}
            onRetry={this.handleRetry}
            showDetails={this.props.showDetails}
          />;
      }
    }

    return this.props.children;
  }
}

/**
 * Page-level Error Fallback
 */
interface ErrorFallbackProps {
  error?: Error;
  errorId: string;
  onRetry: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
}

const PageErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  errorId, 
  onRetry, 
  onGoHome, 
  showDetails = false 
}) => (
  <div className="min-h-screen bg-lime-50 flex items-center justify-center p-4">
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          Something went wrong
        </CardTitle>
        <CardDescription className="text-lg">
          We encountered an unexpected error. Don't worry, this has been logged and we're working on it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Error ID: <code className="bg-gray-200 px-2 py-1 rounded text-xs">{errorId}</code></p>
          <p className="text-sm text-gray-500">
            Please include this ID when reporting the issue to our support team.
          </p>
        </div>

        {showDetails && error && (
          <details className="bg-red-50 p-4 rounded-lg">
            <summary className="cursor-pointer text-sm font-medium text-red-800 mb-2">
              Technical Details (Click to expand)
            </summary>
            <div className="mt-2 text-xs text-red-700 font-mono bg-red-100 p-3 rounded overflow-auto max-h-40">
              <div className="mb-2"><strong>Error:</strong> {error.message}</div>
              <div><strong>Stack:</strong></div>
              <pre className="whitespace-pre-wrap">{error.stack}</pre>
            </div>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onRetry} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          {onGoHome && (
            <Button variant="outline" onClick={onGoHome} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          If this problem persists, please{' '}
          <a href="mailto:support@portalpro.com" className="text-blue-600 hover:underline">
            contact support
          </a>
        </div>
      </CardContent>
    </Card>
  </div>
);

/**
 * Section-level Error Fallback
 */
const SectionErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  errorId, 
  onRetry, 
  showDetails = false 
}) => (
  <Card className="w-full">
    <CardContent className="p-6">
      <div className="text-center space-y-4">
        <div className="mx-auto p-2 bg-red-100 rounded-full w-fit">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to load this section
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            There was a problem loading this part of the page.
          </p>
        </div>

        {showDetails && error && (
          <details className="bg-red-50 p-3 rounded-lg text-left">
            <summary className="cursor-pointer text-sm font-medium text-red-800">
              Error Details
            </summary>
            <div className="mt-2 text-xs text-red-700 font-mono">
              <div>ID: {errorId}</div>
              <div>Message: {error.message}</div>
            </div>
          </details>
        )}

        <Button onClick={onRetry} size="sm" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    </CardContent>
  </Card>
);

/**
 * Component-level Error Fallback
 */
const ComponentErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  errorId, 
  onRetry, 
  showDetails = false 
}) => (
  <div className="border border-red-200 bg-red-50 rounded-lg p-4">
    <div className="flex items-start space-x-3">
      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-red-800">
          Component Error
        </h4>
        <p className="text-sm text-red-700 mt-1">
          This component failed to render properly.
        </p>
        
        {showDetails && error && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-red-600">
              Details
            </summary>
            <div className="mt-1 text-xs text-red-600 font-mono">
              {errorId}: {error.message}
            </div>
          </details>
        )}

        <div className="mt-3">
          <Button 
            onClick={onRetry} 
            size="sm" 
            variant="outline"
            className="text-red-700 border-red-300 hover:bg-red-100"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Hook for functional component error boundaries
 */
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // In a real app, you might want to log to an error service
    console.error('Error caught by error handler:', error, errorInfo);
    
    // You could also show a toast notification
    // toast.error('An unexpected error occurred');
  };
};

/**
 * HOC for wrapping components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Specialized Error Boundaries for different contexts
 */

// API Error Boundary
export const ApiErrorBoundary: React.FC<{ 
  children: ReactNode; 
  onError?: (error: Error) => void;
  onRetry?: () => void;
}> = ({ 
  children, 
  onError,
  onRetry
}) => (
  <ErrorBoundary
    level="section"
    onError={onError}
    fallback={
      <Card>
        <CardContent className="p-6 text-center">
          <Bug className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">API Error</h3>
          <p className="text-gray-600 mb-4">
            There was a problem communicating with the server.
          </p>
          <div className="space-y-2">
            {onRetry ? (
              <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            ) : (
              <Button onClick={() => window.location.reload()} variant="outline">
                Refresh Page
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    }
  >
    {children}
  </ErrorBoundary>
);

// Form Error Boundary  
export const FormErrorBoundary: React.FC<{ children: ReactNode; onError?: (error: Error) => void }> = ({ 
  children, 
  onError 
}) => (
  <ErrorBoundary
    level="component"
    onError={onError}
    fallback={
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-800 font-medium">Form Error</span>
        </div>
        <p className="text-red-700 text-sm mt-1">
          There was a problem with this form. Please refresh the page and try again.
        </p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;