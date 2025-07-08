import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JournalEntryFormData, JournalEntryLineFormData, JournalEntry, ChartOfAccount, Company, JournalTemplateFormData } from '@/types';
import { formatDateForDisplay } from '@/utils';
import { JournalEntryStorageService } from '@/services/storage';
import { JournalEntryValidationService } from '@/services/business/journalEntryValidationService';
import { JournalTemplateService } from '@/services/business/journalTemplateService';
import { JournalTemplateSelector } from './JournalTemplateSelector';
import { Plus, Trash2, AlertCircle, Hash, CheckCircle, TriangleAlert, FileText } from 'lucide-react';

interface JournalEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: JournalEntry; // For editing
  companies: Company[];
  chartOfAccounts: ChartOfAccount[];
  formatCurrency: (amount: number, currency?: string) => string;
  onSave: (data: JournalEntryFormData) => void;
  onCancel: () => void;
}

export const JournalEntryDialog: React.FC<JournalEntryDialogProps> = ({
  open,
  onOpenChange,
  entry,
  companies,
  chartOfAccounts,
  formatCurrency,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<JournalEntryFormData>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    companyId: '',
    status: 'draft',
    lines: [
      { accountId: '', description: '', debit: '0.00', credit: '0.00' },
      { accountId: '', description: '', debit: '0.00', credit: '0.00' }
    ]
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [previewJournalNumber, setPreviewJournalNumber] = useState<string>('');
  const [validationSummary, setValidationSummary] = useState<string>('');
  const [showTemplateSelector, setShowTemplateSelector] = useState<boolean>(false);

  // Initialize form data when editing
  useEffect(() => {
    if (entry) {
      setFormData({
        date: entry.date,
        description: entry.description,
        reference: entry.reference || '',
        companyId: entry.companyId.toString(),
        status: entry.status === 'reversed' ? 'posted' : entry.status, // Don't allow editing reversed entries to reversed status
        lines: entry.lines.map(line => ({
          accountId: line.accountId,
          description: line.description || '',
          debit: line.debit.toFixed(2),
          credit: line.credit.toFixed(2),
          reference: line.reference || ''
        }))
      });
      setPreviewJournalNumber(''); // No preview for existing entries
    } else {
      // Reset form for new entry
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        companyId: companies.length > 0 ? companies[0].id.toString() : '',
        status: 'draft',
        lines: [
          { accountId: '', description: '', debit: '0.00', credit: '0.00' },
          { accountId: '', description: '', debit: '0.00', credit: '0.00' }
        ]
      });
      // Set preview journal number for new entries
      setPreviewJournalNumber(JournalEntryStorageService.getPreviewNextJournalNumber());
    }
    setErrors([]);
    setWarnings([]);
    setValidationSummary('');
  }, [entry, companies, open]);

  const updateFormData = (field: keyof JournalEntryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Real-time validation with debounce
    setTimeout(() => validateForm(), 100);
  };

  const updateLineData = (index: number, field: keyof JournalEntryLineFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }));
    // Real-time validation with debounce
    setTimeout(() => validateForm(), 100);
  };

  const addLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, { accountId: '', description: '', debit: '0.00', credit: '0.00' }]
    }));
  };

  const removeLine = (index: number) => {
    if (formData.lines.length > 2) {
      setFormData(prev => ({
        ...prev,
        lines: prev.lines.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateTotals = () => {
    const totalDebits = formData.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredits = formData.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
    return { totalDebits, totalCredits, difference: totalDebits - totalCredits };
  };

  const validateForm = (): void => {
    // Basic required field validation
    const basicErrors: string[] = [];
    
    if (!formData.companyId) {
      basicErrors.push('Company is required');
    }

    // Use comprehensive validation service
    const validationResult = JournalEntryValidationService.validateJournalEntry(
      formData, 
      chartOfAccounts
    );

    setErrors([...basicErrors, ...validationResult.errors]);
    setWarnings(validationResult.warnings);
    setValidationSummary(JournalEntryValidationService.getValidationSummary(validationResult));
  };

  const handleSave = () => {
    // Run final validation
    const basicErrors: string[] = [];
    
    if (!formData.companyId) {
      basicErrors.push('Company is required');
    }

    const validationResult = JournalEntryValidationService.validateJournalEntry(
      formData, 
      chartOfAccounts
    );

    const allErrors = [...basicErrors, ...validationResult.errors];
    
    // Update state for display
    setErrors(allErrors);
    setWarnings(validationResult.warnings);
    setValidationSummary(JournalEntryValidationService.getValidationSummary(validationResult));
    
    // Check if there are any validation errors
    if (allErrors.length > 0) {
      return;
    }

    onSave(formData);
  };

  const handleCancel = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      companyId: '',
      status: 'draft',
      lines: [
        { accountId: '', description: '', debit: '0.00', credit: '0.00' },
        { accountId: '', description: '', debit: '0.00', credit: '0.00' }
      ]
    });
    setErrors([]);
    setWarnings([]);
    setValidationSummary('');
    setShowTemplateSelector(false);
    onCancel();
  };

  const handleTemplateSelect = (templateData: JournalTemplateFormData) => {
    try {
      const entryFromTemplate = JournalTemplateService.createEntryFromTemplate(
        templateData,
        chartOfAccounts
      );

      // Update form data with template values
      setFormData({
        date: entryFromTemplate.date || new Date().toISOString().split('T')[0],
        description: entryFromTemplate.description || '',
        reference: entryFromTemplate.reference || '',
        companyId: formData.companyId || (companies.length > 0 ? companies[0].id.toString() : ''),
        status: entryFromTemplate.status || 'draft',
        lines: entryFromTemplate.lines?.map(line => ({
          accountId: line.accountId,
          description: line.description || '',
          debit: line.debit.toFixed(2),
          credit: line.credit.toFixed(2),
          reference: line.reference || ''
        })) || []
      });

      setShowTemplateSelector(false);
      
      // Trigger validation after template is applied
      setTimeout(() => validateForm(), 100);
    } catch (error) {
      console.error('Error creating entry from template:', error);
      setErrors(['Failed to create entry from template. Please try again.']);
    }
  };

  const { totalDebits, totalCredits, difference } = calculateTotals();
  const isBalanced = Math.abs(difference) < 0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DialogTitle>
                {entry ? `Edit Journal Entry ${entry.entryNumber}` : 'Create Journal Entry'}
              </DialogTitle>
              {!entry && previewJournalNumber && (
                <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium">
                  <Hash className="h-4 w-4" />
                  <span>{previewJournalNumber}</span>
                </div>
              )}
            </div>
            
            {!entry && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateSelector(true)}
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Use Template</span>
              </Button>
            )}
          </div>
          <DialogDescription>
            {entry ? 'Modify the journal entry details and lines below.' : `Enter the journal entry details with balanced debit and credit amounts. This entry will be assigned number ${previewJournalNumber}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => updateFormData('date', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="company">Company *</Label>
              <Select value={formData.companyId} onValueChange={(value) => updateFormData('companyId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.tradingName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => updateFormData('reference', e.target.value)}
                placeholder="e.g., INV-001, CHK-123"
              />
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => updateFormData('status', value)}
                disabled={entry?.status === 'reversed'} // Can't change status of reversed entries
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span>Draft</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="posted">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Posted</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Enter transaction description"
              rows={2}
            />
          </div>

          {/* Journal Lines */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold">Journal Lines</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLine}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Line
              </Button>
            </div>

            <div className="border rounded-lg">
              {/* Header */}
              <div className="grid grid-cols-12 gap-3 p-4 bg-gray-100 font-semibold text-sm border-b">
                <div className="col-span-4">Account *</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Debit</div>
                <div className="col-span-2">Credit</div>
                <div className="col-span-1"></div>
              </div>

              {/* Lines */}
              {formData.lines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 p-4 border-b last:border-b-0">
                  <div className="col-span-4">
                    <Select 
                      value={line.accountId} 
                      onValueChange={(value) => updateLineData(index, 'accountId', value)}
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {chartOfAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">{account.code}</span>
                              <span>{account.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    <Input
                      className="h-10 text-sm"
                      value={line.description}
                      onChange={(e) => updateLineData(index, 'description', e.target.value)}
                      placeholder="Line description"
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      className="h-10 text-sm text-right font-mono"
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.debit}
                      onChange={(e) => updateLineData(index, 'debit', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      className="h-10 text-sm text-right font-mono"
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.credit}
                      onChange={(e) => updateLineData(index, 'credit', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="col-span-1 flex justify-center">
                    {formData.lines.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(index)}
                        className="h-10 w-10 p-0 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="grid grid-cols-12 gap-3 p-4 bg-gray-100 font-semibold text-sm border-t-2">
                <div className="col-span-7 text-right">TOTALS:</div>
                <div className="col-span-2 text-right font-mono">
                  {formatCurrency(totalDebits)}
                </div>
                <div className="col-span-2 text-right font-mono">
                  {formatCurrency(totalCredits)}
                </div>
                <div className="col-span-1"></div>
              </div>

              {/* Balance Status & Validation Summary */}
              <div className={`p-2 text-center text-sm font-medium ${
                isBalanced 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                {isBalanced ? (
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Entry is balanced</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Out of balance by {formatCurrency(Math.abs(difference))}</span>
                  </div>
                )}
              </div>
              
              {/* Validation Summary */}
              {validationSummary && (
                <div className="p-2 text-center text-xs text-gray-600 border-t">
                  {validationSummary}
                </div>
              )}
            </div>
          </div>

          {/* Status Warning */}
          {formData.status === 'posted' && !entry && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800">Posting Journal Entry</span>
              </div>
              <p className="text-sm text-amber-700">
                This entry will be posted immediately and will affect your financial statements. 
                Posted entries can only be corrected by creating a reversal entry.
              </p>
            </div>
          )}

          {/* Validation Warnings */}
          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TriangleAlert className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800">Validation Warnings:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
              <p className="text-xs text-amber-600 mt-2">
                Warnings don't prevent saving, but you should review them carefully.
              </p>
            </div>
          )}

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">Please fix the following errors:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!isBalanced || errors.length > 0}
            className={formData.status === 'posted' ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
          >
            {entry ? 'Update Entry' : 
             formData.status === 'posted' ? 'Create & Post Entry' : 'Create Draft Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Template Selector Modal */}
      <JournalTemplateSelector
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
        onTemplateSelect={handleTemplateSelect}
      />
    </Dialog>
  );
};