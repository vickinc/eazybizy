"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DataMigrationWizard } from "@/components/features/DataMigrationWizard";
import { useCompanyFilter } from '@/contexts/CompanyFilterContext';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useEffect } from 'react';
import Database from "lucide-react/dist/esm/icons/database";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Info from "lucide-react/dist/esm/icons/info";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import Zap from "lucide-react/dist/esm/icons/zap";
import { MigrationResult } from "@/services/business/dataMigrationBusinessService";

export default function DataMigrationPage() {
  const { companies } = useCompanyFilter();
  const [isLoading, setIsLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [migrationHistory, setMigrationHistory] = useState<MigrationResult[]>([]);

  useEffect(() => {
    // Load migration history and prepare page
    const loadMigrationData = async () => {
      try {
        // Simulate loading migration history
        await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay, let delayed hook handle the rest
        // Here you would load actual migration history from localStorage or API
        const history = JSON.parse(localStorage.getItem('migration-history') || '[]');
        setMigrationHistory(history);
      } catch (error) {
        console.error('Error loading migration data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMigrationData();
  }, []);

  const handleMigrationComplete = (result: MigrationResult) => {
    setMigrationHistory(prev => [result, ...prev]);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const showLoader = useDelayedLoading(isLoading);

  if (showLoader) {
    return <LoadingScreen />;
  }

  if (showWizard) {
    return (
      <DataMigrationWizard
        companies={companies}
        onMigrationComplete={handleMigrationComplete}
        onClose={() => setShowWizard(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Database className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold tracking-tight">Data Migration</h1>
          </div>
          <p className="text-muted-foreground">
            Migrate your existing income and expense entries to the new journal entry system for improved double-entry bookkeeping.
          </p>
        </div>
      </div>

      {/* Migration Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Migration Overview</span>
          </CardTitle>
          <CardDescription>
            Understand what the migration process does and why it's beneficial.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">What gets migrated?</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Income entries → Revenue journal entries</li>
                <li>• Expense entries → Expense journal entries</li>
                <li>• Categories mapped to chart of accounts</li>
                <li>• All transaction details preserved</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Benefits of migration</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Proper double-entry bookkeeping</li>
                <li>• Balanced debits and credits</li>
                <li>• Better financial reporting</li>
                <li>• Audit trail improvements</li>
              </ul>
            </div>
          </div>

          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Before starting migration, ensure you have a complete chart of accounts set up 
              with appropriate asset, revenue, and expense accounts. The migration will map your categories to these accounts.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button onClick={() => setShowWizard(true)} className="bg-blue-600 hover:bg-blue-700">
              <Database className="h-4 w-4 mr-2" />
              Start Migration Wizard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Migration History */}
      {migrationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Migration History</CardTitle>
            <CardDescription>
              Previous migration runs and their results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {migrationHistory.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">
                        {result.success ? 'Successful Migration' : 'Migration with Errors'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(new Date())}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Processed</div>
                      <div className="font-medium">{result.totalProcessed}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Migrated</div>
                      <div className="font-medium text-green-600">{result.migratedCount}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Skipped</div>
                      <div className="font-medium text-yellow-600">{result.skippedCount}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Errors</div>
                      <div className="font-medium text-red-600">{result.errorCount}</div>
                    </div>
                  </div>

                  {result.errors.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 rounded border">
                      <div className="text-sm font-medium text-red-800 mb-1">Errors:</div>
                      <div className="text-sm text-red-700 space-y-1">
                        {result.errors.slice(0, 3).map((error, errorIndex) => (
                          <div key={errorIndex}>• {error}</div>
                        ))}
                        {result.errors.length > 3 && (
                          <div>... and {result.errors.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Before You Start</CardTitle>
          <CardDescription>
            Steps to ensure a successful migration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium">Set up Chart of Accounts</h3>
                <p className="text-sm text-gray-600">
                  Ensure you have asset accounts (bank/cash), revenue accounts, and expense accounts configured.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium">Review Income & Expense Categories</h3>
                <p className="text-sm text-gray-600">
                  The migration will attempt to map your categories to chart of accounts. Review your categories for consistency.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium">Backup Your Data</h3>
                <p className="text-sm text-gray-600">
                  Consider exporting your current income and expense data before migration, especially if you plan to delete original data.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h3 className="font-medium">Run the Migration</h3>
                <p className="text-sm text-gray-600">
                  Use the migration wizard to configure options, preview changes, and execute the migration.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}