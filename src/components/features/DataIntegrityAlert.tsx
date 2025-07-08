import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Download, RefreshCw, Shield } from "lucide-react";
import { DataRecoveryService } from '@/services/recovery/dataRecoveryService';
import { BookkeepingStorageService } from '@/services/storage/bookkeepingStorageService';

interface DataIntegrityAlertProps {
  onDismiss?: () => void;
  showDetailed?: boolean;
}

export const DataIntegrityAlert: React.FC<DataIntegrityAlertProps> = ({ 
  onDismiss, 
  showDetailed = false 
}) => {
  const [integrityReport, setIntegrityReport] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(showDetailed);

  useEffect(() => {
    checkDataIntegrity();
  }, []);

  const checkDataIntegrity = () => {
    try {
      setIsLoading(true);
      const report = DataRecoveryService.analyzeLocalStorageData();
      setIntegrityReport(report);
      
      // Only show alert if there are issues or if explicitly requested
      if (report.possibleDataLoss || report.recommendations.some(r => r.includes('⚠️')) || showDetailed) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Error checking data integrity:', error);
      setIntegrityReport({
        possibleDataLoss: true,
        recommendations: ['Error analyzing data - please check browser console']
      });
      setIsVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleCreateBackup = () => {
    try {
      const backup = BookkeepingStorageService.createBackup();
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bookkeeping-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Failed to create backup. Please check the browser console for details.');
    }
  };

  const handleRunDiagnostics = () => {
    DataRecoveryService.logDetailedReport();
    alert('Detailed diagnostics have been logged to the browser console. Press F12 to view.');
  };

  if (isLoading || !isVisible || !integrityReport) {
    return null;
  }

  const alertVariant = integrityReport.possibleDataLoss ? "destructive" : "default";
  const Icon = integrityReport.possibleDataLoss ? AlertTriangle : CheckCircle;

  return (
    <div className="mb-6">
      <Alert variant={alertVariant} className="border-l-4">
        <Icon className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>
            {integrityReport.possibleDataLoss 
              ? "⚠️ Data Integrity Alert" 
              : "✅ Data Status Check"
            }
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Hide Details" : "Show Details"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
            >
              ×
            </Button>
          </div>
        </AlertTitle>
        <AlertDescription className="mt-2">
          {integrityReport.possibleDataLoss ? (
            <div>
              <p className="font-semibold text-red-800 mb-2">
                Potential data loss detected in your bookkeeping entries.
              </p>
              <p>
                We've identified patterns that suggest some expense entries may have been 
                affected during a recent system update. Your data is safe, but you may need 
                to review and restore missing entries.
              </p>
            </div>
          ) : (
            <p>Your bookkeeping data appears to be in good condition.</p>
          )}
        </AlertDescription>

        {showDetails && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4" />
                Data Analysis Report
              </CardTitle>
              <CardDescription>
                Storage format: <Badge variant="outline">{integrityReport.storageFormat}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{integrityReport.totalEntries}</div>
                  <div className="text-xs text-gray-600">Total Entries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{integrityReport.incomeEntries}</div>
                  <div className="text-xs text-gray-600">Income</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{integrityReport.expenseEntries}</div>
                  <div className="text-xs text-gray-600">Expenses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{integrityReport.invalidEntries}</div>
                  <div className="text-xs text-gray-600">Invalid</div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-semibold mb-2">Recommendations:</h4>
                <ul className="space-y-1">
                  {integrityReport.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCreateBackup}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Create Backup
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRunDiagnostics}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Run Diagnostics
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={checkDataIntegrity}
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Recheck Data
                </Button>
              </div>

              {integrityReport.possibleDataLoss && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Next Steps:</h4>
                  <ol className="text-sm text-yellow-700 space-y-1">
                    <li>1. Create a backup of your current data using the button above</li>
                    <li>2. Check if you have any external backups of your bookkeeping data</li>
                    <li>3. Review your expense entries to identify any missing items</li>
                    <li>4. Contact support if you need help recovering data</li>
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </Alert>
    </div>
  );
};

// Hook for easy usage in pages
export const useDataIntegrityCheck = () => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check if we should show the alert
    const checkIntegrity = () => {
      try {
        const integrityCheck = BookkeepingStorageService.checkDataIntegrity();
        if (!integrityCheck.isValid) {
          setShouldShow(true);
        }
      } catch (error) {
        console.error('Error checking data integrity:', error);
        setShouldShow(true);
      }
    };

    // Only check on pages that use bookkeeping data
    const currentPath = window.location.pathname;
    const bookkeepingPages = ['/accounting', '/financials', '/bookkeeping'];
    
    if (bookkeepingPages.some(page => currentPath.includes(page))) {
      checkIntegrity();
    }
  }, []);

  return {
    shouldShowAlert: shouldShow,
    dismissAlert: () => setShouldShow(false)
  };
};