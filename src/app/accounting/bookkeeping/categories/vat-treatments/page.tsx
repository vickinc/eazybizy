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
import { useVATTreatmentManagement } from '@/hooks/useVATTreatmentManagement';
import { VATTreatmentDialog } from '@/components/features/VATTreatmentDialog';
import { VATTreatmentList } from '@/components/features/VATTreatmentList';
import { VATTreatmentFilterBar } from '@/components/features/VATTreatmentFilterBar';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useState, useEffect } from 'react';

export default function VATTreatmentsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const vatManagement = useVATTreatmentManagement();

  useEffect(() => {
    // Simulate loading VAT treatments data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    
    return () => clearTimeout(timer);
  }, []);

  const handleExportCSV = () => {
    const csvData = vatManagement.exportToCSV();
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vat-treatments.csv';
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
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
          <Link 
            href="/accounting/bookkeeping/categories" 
            className="flex items-center hover:text-gray-900 transition-colors"
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Chart of Accounts
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">VAT Treatments</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <Link
              href="/accounting/bookkeeping/categories"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                VAT Treatments
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Manage VAT rates, categories, and applicability for accounting transactions
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Initialize/Reset Actions */}
            {vatManagement.treatments.length === 0 && (
              <Button
                variant="default"
                onClick={vatManagement.initializeDefaults}
                className="w-full sm:w-auto"
              >
                <FileText className="h-4 w-4 mr-2" />
                Load Default Treatments
              </Button>
            )}
            
            {vatManagement.treatments.length > 0 && (
              <Button
                variant="outline"
                onClick={handleExportCSV}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
            
            <Button
              onClick={vatManagement.handleCreate}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Treatment
            </Button>
          </div>
        </div>


        {/* Filter Bar */}
        {vatManagement.treatments.length > 0 && (
          <VATTreatmentFilterBar
            filter={vatManagement.filter}
            onFilterChange={vatManagement.handleFilterChange}
            onClearFilters={vatManagement.clearFilters}
            className="mb-6"
            treatmentCount={vatManagement.filteredTreatments.length}
            totalCount={vatManagement.treatments.length}
          />
        )}

        {/* Main Content */}
        <VATTreatmentList
          treatments={vatManagement.filteredTreatments}
          onEdit={vatManagement.handleEdit}
          onDelete={vatManagement.handleDelete}
          onToggleActive={vatManagement.handleToggleActive}
          sortConfig={vatManagement.sortConfig}
          onSort={vatManagement.handleSort}
          isLoaded={vatManagement.isLoaded}
        />

        {/* VAT Treatment Dialog */}
        <VATTreatmentDialog
          isOpen={vatManagement.showDialog}
          onOpenChange={vatManagement.setShowDialog}
          formData={vatManagement.formData}
          editingTreatment={vatManagement.editingTreatment}
          onFormInputChange={vatManagement.handleFormInputChange}
          onFormSubmit={vatManagement.handleFormSubmit}
          onCancel={() => {
            vatManagement.setShowDialog(false);
            vatManagement.resetForm();
          }}
          getFieldError={vatManagement.getFieldError}
          hasFieldError={vatManagement.hasFieldError}
          isSubmitting={vatManagement.isSubmitting}
        />


        {/* Help Information */}
        {vatManagement.isLoaded && vatManagement.treatments.length === 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Getting Started with VAT Treatments</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                VAT treatments define how different tax rates and rules apply to your transactions. 
                Each treatment includes:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Code:</strong> Unique identifier for the treatment</li>
                <li><strong>Rate:</strong> VAT percentage (0-100%)</li>
                <li><strong>Category:</strong> Type of VAT treatment (standard, reduced, exempt, etc.)</li>
                <li><strong>Applicability:</strong> When the treatment applies (sales, purchases, assets, etc.)</li>
              </ul>
              <p className="mt-3">
                Click "Load Default Treatments" to start with standard VAT treatments, 
                or "Add Treatment" to create your own custom treatments.
              </p>
            </div>
          </div>
        )}

        {/* Return to Categories Link */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            href="/accounting/bookkeeping/categories"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Chart of Accounts
          </Link>
        </div>
      </div>
    </div>
  );
}