"use client";

import React from "react";
import Link from "next/link";
import Calculator from "lucide-react/dist/esm/icons/calculator";
import Plus from "lucide-react/dist/esm/icons/plus";
import Download from "lucide-react/dist/esm/icons/download";
import FileText from "lucide-react/dist/esm/icons/file-text";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import { Button } from "@/components/ui/button";
import { useTaxTreatmentManagementAPI } from '@/hooks/useTaxTreatmentManagementAPI';
import { TaxTreatmentDialog } from '@/components/features/TaxTreatmentDialog';
import { TaxTreatmentList } from '@/components/features/TaxTreatmentList';
import { TaxTreatmentFilterBar } from '@/components/features/TaxTreatmentFilterBar';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useState, useEffect } from 'react';

export default function TaxTreatmentsClient() {
  const [isLoading, setIsLoading] = useState(true);
  const taxManagement = useTaxTreatmentManagementAPI();

  useEffect(() => {
    // Simulate loading tax treatments data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    
    return () => clearTimeout(timer);
  }, []);

  const handleExportCSV = () => {
    const csvData = taxManagement.exportToCSV();
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tax-treatments.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/accounting" className="hover:text-blue-600 transition-colors">
              Accounting
            </Link>
            <span>/</span>
            <Link href="/accounting/bookkeeping" className="hover:text-blue-600 transition-colors">
              Bookkeeping
            </Link>
            <span>/</span>
            <Link href="/accounting/bookkeeping/categories" className="hover:text-blue-600 transition-colors">
              Categories
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Tax Treatments</span>
          </nav>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link 
                href="/accounting/bookkeeping/categories"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Tax Treatments
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Manage tax rates (VAT/Sales Tax/GST), categories, and applicability for accounting transactions
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                className="hidden sm:flex"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={taxManagement.handleCreate}
                size="sm"
                className="!bg-lime-400 hover:!bg-lime-500 text-gray-900"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Treatment
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Treatments</p>
                <p className="text-2xl font-bold text-gray-900">{taxManagement.stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{taxManagement.stats.active}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-500">{taxManagement.stats.inactive}</p>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Object.keys(taxManagement.stats.byCategory).filter(key => 
                    taxManagement.stats.byCategory[key as keyof typeof taxManagement.stats.byCategory] > 0
                  ).length}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6">
          <TaxTreatmentFilterBar
            filter={taxManagement.filter}
            onFilterChange={taxManagement.handleFilterChange}
            onClearFilters={taxManagement.clearFilters}
          />
        </div>

        {/* Tax Treatments List */}
        <div className="bg-white rounded-xl border border-gray-200">
          <TaxTreatmentList
            treatments={taxManagement.filteredTreatments}
            sortConfig={taxManagement.sortConfig}
            onSort={taxManagement.handleSort}
            onEdit={taxManagement.handleEdit}
            onDelete={taxManagement.handleDelete}
            onToggleActive={taxManagement.handleToggleActive}
            isLoading={!taxManagement.isLoaded}
          />
        </div>

        {/* Tax Treatment Dialog */}
        <TaxTreatmentDialog
          open={taxManagement.showDialog}
          onOpenChange={taxManagement.setShowDialog}
          treatment={taxManagement.editingTreatment}
          formData={taxManagement.formData}
          onFormDataChange={taxManagement.handleFormInputChange}
          onSubmit={taxManagement.handleFormSubmit}
          validationErrors={taxManagement.validationErrors}
          isSubmitting={taxManagement.isSubmitting}
        />
      </div>
    </div>
  );
}