"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode; // Optional custom fallback UI
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service here
    // For now, just log to console
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    // Optionally, you could try to re-render the children or trigger a refresh
    // For a simple retry, just resetting the error state might allow recovery
    // if the error was transient. A full page reload might be more robust.
    // window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700"
        >
          <h2 className="text-lg font-semibold mb-2">Oops, something went wrong.</h2>
          <p className="mb-1">
            We encountered an error trying to display this part of the application.
            Please try refreshing the page or click the button below.
          </p>
          {this.state.error && (
            <details className="mb-2 text-sm">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="mt-1 p-2 bg-red-100 text-xs rounded overflow-auto">
                {this.state.error.name}: {this.state.error.message}
                {this.state.error.stack && `\n${this.state.error.stack}`}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleRetry}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
