import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Database from "lucide-react/dist/esm/icons/database";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import XCircle from "lucide-react/dist/esm/icons/circle";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import FileText from "lucide-react/dist/esm/icons/file-text";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { DataMigrationBusinessService, MigrationOptions, MigrationResult } from '@/services/business/dataMigrationBusinessService';
import { Company } from '@/types';

interface DataMigrationWizardProps {
  companies: Company[];
  onMigrationComplete: (result: MigrationResult) => void;
  onClose: () => void;
}

type WizardStep = 'options' | 'preview' | 'migrate' | 'results';

export const DataMigrationWizard: React.FC<DataMigrationWizardProps> = ({
  companies,
  onMigrationComplete,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('options');
  const [options, setOptions] = useState<MigrationOptions>({
    includeIncomeEntries: true,
    includeExpenseEntries: true,
    markAsPosted: false,
    deleteOriginalData: false,
    companyId: undefined,
    dateRange: undefined
  });
  
  const [prerequisites, setPrerequisites] = useState<{ valid: boolean; errors: string[] }>({ valid: true, errors: [] });
  const [preview, setPreview] = useState<any>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Check prerequisites on component mount
  useEffect(() => {
    const validation = DataMigrationBusinessService.validateMigrationPrerequisites();
    setPrerequisites(validation);
  }, []);

  // Update preview when options change
  useEffect(() => {
    if (currentStep === 'preview') {
      const previewData = DataMigrationBusinessService.getMigrationPreview(options);
      setPreview(previewData);
    }
  }, [options, currentStep]);

  const handleNextStep = () => {
    switch (currentStep) {
      case 'options':
        setCurrentStep('preview');
        break;
      case 'preview':
        setCurrentStep('migrate');
        break;
    }
  };

  const handlePreviousStep = () => {
    switch (currentStep) {
      case 'preview':
        setCurrentStep('options');
        break;
      case 'migrate':
        setCurrentStep('preview');
        break;
      case 'results':
        setCurrentStep('migrate');
        break;
    }
  };

  const runMigration = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await DataMigrationBusinessService.migrateToJournalEntries(options);
      
      clearInterval(progressInterval);
      setProgress(100);
      setMigrationResult(result);
      setCurrentStep('results');
      
      if (result.success) {
        onMigrationComplete(result);
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationResult({
        success: false,
        totalProcessed: 0,
        migratedCount: 0,
        skippedCount: 0,
        errorCount: 1,
        errors: [(error as Error).message],
        migratedEntries: []
      });
      setCurrentStep('results');
    } finally {
      setIsRunning(false);
    }
  }, [options, onMigrationComplete]);

  const renderOptionsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Migration Options</span>
        </CardTitle>
        <CardDescription>
          Configure what data to migrate and how to handle the migration process.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prerequisites Check */}
        {!prerequisites.valid && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Prerequisites not met:</div>
                {prerequisites.errors.map((error, index) => (
                  <div key={index} className="text-sm">• {error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Data Type Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Data to Migrate</Label>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="income"
              checked={options.includeIncomeEntries}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, includeIncomeEntries: !!checked }))
              }
            />
            <Label htmlFor="income" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span>Income Entries</span>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="expense"
              checked={options.includeExpenseEntries}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, includeExpenseEntries: !!checked }))
              }
            />
            <Label htmlFor="expense" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-red-600" />
              <span>Expense Entries</span>
            </Label>
          </div>
        </div>

        {/* Company Filter */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Company Filter</span>
          </Label>
          <Select
            value={options.companyId?.toString() || 'all'}
            onValueChange={(value) => 
              setOptions(prev => ({ 
                ...prev, 
                companyId: value === 'all' ? undefined : parseInt(value) 
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map(company => (
                <SelectItem key={company.id} value={company.id.toString()}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Date Range (Optional)</span>
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="startDate" className="text-sm">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={options.dateRange?.start || ''}
                onChange={(e) => setOptions(prev => ({
                  ...prev,
                  dateRange: {
                    start: e.target.value,
                    end: prev.dateRange?.end || ''
                  }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-sm">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={options.dateRange?.end || ''}
                onChange={(e) => setOptions(prev => ({
                  ...prev,
                  dateRange: {
                    start: prev.dateRange?.start || '',
                    end: e.target.value
                  }
                }))}
              />
            </div>
          </div>
        </div>

        {/* Migration Options */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Migration Settings</Label>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="markPosted"
              checked={options.markAsPosted}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, markAsPosted: !!checked }))
              }
            />
            <Label htmlFor="markPosted">Mark migrated entries as Posted</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="deleteOriginal"
              checked={options.deleteOriginalData}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, deleteOriginalData: !!checked }))
              }
            />
            <Label htmlFor="deleteOriginal" className="flex items-center space-x-2">
              <Trash2 className="h-4 w-4 text-red-500" />
              <span>Delete original data after migration</span>
            </Label>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleNextStep}
            disabled={!prerequisites.valid || (!options.includeIncomeEntries && !options.includeExpenseEntries)}
          >
            Next: Preview
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPreviewStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Migration Preview</span>
        </CardTitle>
        <CardDescription>
          Review what will be migrated before proceeding.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {preview && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{preview.incomeCount}</div>
                <div className="text-sm text-green-700">Income Entries</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{preview.expenseCount}</div>
                <div className="text-sm text-red-700">Expense Entries</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{preview.incomeCount + preview.expenseCount}</div>
                <div className="text-sm text-blue-700">Total Entries</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">${preview.totalAmount.toLocaleString()}</div>
                <div className="text-sm text-purple-700">Total Amount</div>
              </div>
            </div>

            {preview.dateRange && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium">Date Range</div>
                <div className="text-sm text-gray-600">
                  {preview.dateRange.start} to {preview.dateRange.end}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="font-medium">Migration Settings</div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <Badge variant={options.markAsPosted ? "default" : "secondary"}>
                    {options.markAsPosted ? "Posted" : "Draft"}
                  </Badge>
                  <span>Entry Status</span>
                </div>
                {options.deleteOriginalData && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <Trash2 className="h-4 w-4" />
                    <span>Original data will be deleted</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handlePreviousStep}>
            Back
          </Button>
          <Button 
            onClick={handleNextStep}
            disabled={!preview || (preview.incomeCount + preview.expenseCount) === 0}
          >
            Start Migration
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderMigrationStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <RefreshCw className={`h-5 w-5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>Running Migration</span>
        </CardTitle>
        <CardDescription>
          Migrating your income and expense entries to journal entries...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Progress value={progress} className="w-full" />
        
        <div className="text-center text-sm text-gray-600">
          {isRunning ? 'Processing entries...' : 'Ready to start migration'}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handlePreviousStep} disabled={isRunning}>
            Back
          </Button>
          <Button onClick={runMigration} disabled={isRunning}>
            {isRunning ? 'Migrating...' : 'Start Migration'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderResultsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {migrationResult?.success ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <span>Migration Results</span>
        </CardTitle>
        <CardDescription>
          {migrationResult?.success ? 'Migration completed successfully!' : 'Migration completed with errors.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {migrationResult && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{migrationResult.totalProcessed}</div>
                <div className="text-sm text-blue-700">Total Processed</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{migrationResult.migratedCount}</div>
                <div className="text-sm text-green-700">Successfully Migrated</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{migrationResult.skippedCount}</div>
                <div className="text-sm text-yellow-700">Skipped</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{migrationResult.errorCount}</div>
                <div className="text-sm text-red-700">Errors</div>
              </div>
            </div>

            {migrationResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">Errors encountered:</div>
                    <div className="max-h-32 overflow-y-auto">
                      {migrationResult.errors.map((error, index) => (
                        <div key={index} className="text-sm">• {error}</div>
                      ))}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'options': return renderOptionsStep();
      case 'preview': return renderPreviewStep();
      case 'migrate': return renderMigrationStep();
      case 'results': return renderResultsStep();
      default: return renderOptionsStep();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Data Migration Wizard</h1>
        <p className="text-gray-600">
          Migrate your existing income and expense entries to the new journal entry system.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        {['Options', 'Preview', 'Migrate', 'Results'].map((step, index) => (
          <React.Fragment key={step}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              ['options', 'preview', 'migrate', 'results'].indexOf(currentStep) >= index
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {index + 1}
            </div>
            {index < 3 && (
              <div className={`h-1 w-16 mx-2 ${
                ['options', 'preview', 'migrate', 'results'].indexOf(currentStep) > index
                  ? 'bg-blue-600'
                  : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {renderCurrentStep()}
    </div>
  );
};