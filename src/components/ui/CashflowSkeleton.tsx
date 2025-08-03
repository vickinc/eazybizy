"use client";

import React from 'react';

export function CashflowSkeleton() {
  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header skeleton */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-200 rounded-lg animate-pulse">
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gray-300 rounded"></div>
            </div>
            <div>
              <div className="h-6 sm:h-8 w-48 bg-gray-300 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Filter controls skeleton */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-18 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="flex-1">
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-20 bg-gray-300 rounded animate-pulse mb-2"></div>
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Action buttons skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Main content area skeleton */}
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Tabs skeleton */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex space-x-8">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>

          {/* Content skeleton */}
          <div className="p-6">
            {/* Table header skeleton */}
            <div className="grid grid-cols-6 gap-4 mb-4 pb-3 border-b border-gray-100">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>

            {/* Table rows skeleton */}
            {[...Array(8)].map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-6 gap-4 py-3 border-b border-gray-50">
                {[...Array(6)].map((_, colIndex) => (
                  <div key={colIndex} className="space-y-1">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    {colIndex === 0 && (
                      <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse"></div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Pagination skeleton */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex space-x-2">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-64 w-full bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}