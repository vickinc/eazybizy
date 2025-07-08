"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MonitorSpeaker, Plus, Download, FileText, ArrowLeft, Calculator, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFixedAssetsManagement } from '@/hooks/useFixedAssetsManagement';
import { FixedAssetList } from '@/components/features/FixedAssetList';
import { FixedAssetDialog } from '@/components/features/FixedAssetDialog';
import { FixedAssetFilterBar } from '@/components/features/FixedAssetFilterBar';
import { DepreciationScheduleTable } from '@/components/features/DepreciationScheduleTable';
import { FixedAsset } from '@/types/fixedAssets.types';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useEffect } from 'react';

export default function FixedAssetsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const assetsManagement = useFixedAssetsManagement();
  const [scheduleAsset, setScheduleAsset] = useState<FixedAsset | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  useEffect(() => {
    // Simulate loading fixed assets data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100); // Reduced delay, let delayed hook handle the rest
    
    return () => clearTimeout(timer);
  }, []);

  const handleExportCSV = () => {
    const csvData = assetsManagement.exportToCSV();
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fixed-assets-register.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleViewSchedule = (asset: FixedAsset) => {
    setScheduleAsset(asset);
    setShowScheduleDialog(true);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const showLoader = useDelayedLoading(isLoading);

  if (showLoader) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
          <Link 
            href="/accounting" 
            className="flex items-center hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Accounting
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Fixed Assets</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MonitorSpeaker className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                Fixed Assets Register
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Manage your fixed assets, depreciation, and disposal tracking
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Initialize/Reset Actions */}
            {assetsManagement.assets.length === 0 && (
              <Button
                variant="default"
                onClick={assetsManagement.initializeDefaultAssets}
                className="w-full sm:w-auto"
              >
                <FileText className="h-4 w-4 mr-2" />
                Load Sample Assets
              </Button>
            )}
            
            {assetsManagement.assets.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={assetsManagement.refreshDepreciation}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update Depreciation
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </>
            )}
            
            <Button
              onClick={assetsManagement.handleCreate}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </div>
        </div>

        {/* Stats Dashboard */}
        {assetsManagement.assets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {assetsManagement.stats.total}
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Active: {assetsManagement.stats.byStatus.active || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(assetsManagement.stats.totalCost)}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Acquisition value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Book Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(assetsManagement.stats.totalBookValue)}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Current value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Depreciation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(assetsManagement.stats.totalDepreciation)}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Fully depreciated: {assetsManagement.stats.fullyDepreciated}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Bar */}
        {assetsManagement.assets.length > 0 && (
          <FixedAssetFilterBar
            filter={assetsManagement.filter}
            onFilterChange={assetsManagement.handleFilterChange}
            onClearFilters={assetsManagement.clearFilters}
            assetCount={assetsManagement.filteredAssets.length}
            totalCount={assetsManagement.assets.length}
          />
        )}

        {/* Main Content */}
        <FixedAssetList
          assets={assetsManagement.filteredAssets}
          onEdit={assetsManagement.handleEdit}
          onDelete={assetsManagement.handleDelete}
          onDispose={assetsManagement.handleDispose}
          onViewSchedule={handleViewSchedule}
          sortConfig={assetsManagement.sortConfig}
          onSort={assetsManagement.handleSort}
          isLoaded={assetsManagement.isLoaded}
        />

        {/* Asset Dialog */}
        <FixedAssetDialog
          isOpen={assetsManagement.showAssetDialog}
          onOpenChange={assetsManagement.setShowAssetDialog}
          formData={assetsManagement.formData}
          editingAsset={assetsManagement.editingAsset}
          onFormInputChange={assetsManagement.handleFormInputChange}
          onFormSubmit={assetsManagement.handleFormSubmit}
          onCancel={() => {
            assetsManagement.setShowAssetDialog(false);
            assetsManagement.resetForm();
          }}
          getFieldError={assetsManagement.getFieldError}
          hasFieldError={assetsManagement.hasFieldError}
          isSubmitting={assetsManagement.isSubmitting}
        />

        {/* Depreciation Schedule Dialog */}
        <DepreciationScheduleTable
          isOpen={showScheduleDialog}
          onOpenChange={setShowScheduleDialog}
          asset={scheduleAsset}
          schedule={scheduleAsset ? assetsManagement.generateDepreciationSchedule(scheduleAsset) : []}
        />

        {/* Help Information */}
        {assetsManagement.isLoaded && assetsManagement.assets.length === 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Getting Started with Fixed Assets</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                Track your company's fixed assets including equipment, vehicles, buildings, and more. 
                The system automatically calculates depreciation and maintains a complete asset register.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Asset Management:</strong> Record acquisition details, location, and assignment</li>
                <li><strong>Depreciation:</strong> Multiple methods including straight-line, declining balance</li>
                <li><strong>Disposal Tracking:</strong> Record sales, disposals, and calculate gains/losses</li>
                <li><strong>Reports:</strong> Generate asset registers, depreciation schedules, and disposal reports</li>
              </ul>
              <p className="mt-3">
                Click "Load Sample Assets" to start with example data, 
                or "Add Asset" to begin recording your actual fixed assets.
              </p>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {assetsManagement.assets.length > 5 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Assets by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(assetsManagement.stats.byCategory)
                    .filter(([_, count]) => count > 0)
                    .map(([category, count]) => {
                      const categoryAssets = assetsManagement.assets.filter(asset => asset.category === category);
                      const totalValue = categoryAssets.reduce((sum, asset) => sum + asset.currentBookValue, 0);
                      
                      return (
                        <div key={category} className="border rounded-lg p-4">
                          <h4 className="font-medium text-sm">{category}</h4>
                          <div className="text-2xl font-bold mt-1">{count}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Value: {formatCurrency(totalValue)}
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}