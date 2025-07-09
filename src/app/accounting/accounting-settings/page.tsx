"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarIcon, 
  BookOpenIcon, 
  BuildingIcon, 
  UserIcon,
  InfoIcon,
  SaveIcon,
  AlertTriangleIcon
} from 'lucide-react';
import { useFinancialPeriods } from '@/hooks/useFinancialPeriods';
import { 
  FISCAL_YEAR_START_MONTHS,
  PERIOD_TYPES,
  PERIOD_TYPE_DESCRIPTIONS
} from '@/types/financialPeriods.types';
import { 
  IFRSSettingsFormData,
  CompanySettingsFormData,
  DEFAULT_IFRS_SETTINGS,
  DEFAULT_COMPANY_SETTINGS,
  ACCOUNTING_STANDARDS,
  MATERIALITY_BASIS_OPTIONS,
  REPORTING_FREQUENCIES,
  CASH_FLOW_METHODS,
  ENTITY_TYPES
} from '@/types/settings.types';
import { SettingsStorageService } from '@/services/storage/settingsStorageService';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useEffect } from 'react';

const SettingsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Financial Periods State
  const { settings: periodsSettings, updateSettings } = useFinancialPeriods();
  
  // IFRS Settings State
  const [ifrsSettings, setIFRSSettings] = useState<IFRSSettingsFormData>(() => {
    const stored = SettingsStorageService.getIFRSSettings();
    return {
      accountingStandard: stored.accountingStandard,
      ifrsVersion: stored.ifrsVersion,
      adoptionDate: stored.adoptionDate,
      functionalCurrency: stored.functionalCurrency,
      presentationCurrency: stored.presentationCurrency,
      materialityThreshold: stored.materialityThreshold,
      materialityBasis: stored.materialityBasis,
      roundingPrecision: stored.roundingPrecision,
      reportingFrequency: stored.reportingFrequency,
      consolidationRequired: stored.consolidationRequired,
      segmentReportingRequired: stored.segmentReportingRequired,
      comparativePeriodRequired: stored.comparativePeriodRequired,
      interimReportingRequired: stored.interimReportingRequired,
      cashFlowMethod: stored.cashFlowMethod,
      externalAuditRequired: stored.externalAuditRequired,
      auditFirmName: stored.auditFirmName,
      complianceOfficer: stored.complianceOfficer
    };
  });

  // Company Settings State
  const [companySettings, setCompanySettings] = useState<CompanySettingsFormData>(() => {
    const stored = SettingsStorageService.getCompanySettings();
    return {
      companyName: stored.companyName,
      legalName: stored.legalName,
      registrationNumber: stored.registrationNumber,
      taxIdentificationNumber: stored.taxIdentificationNumber,
      address: stored.address,
      contactInfo: stored.contactInfo,
      entityType: stored.entityType,
      incorporationDate: stored.incorporationDate,
      incorporationJurisdiction: stored.incorporationJurisdiction,
      industryCode: stored.industryCode,
      businessDescription: stored.businessDescription,
      fiscalYearEnd: stored.fiscalYearEnd,
      stockExchange: stored.stockExchange,
      tickerSymbol: stored.tickerSymbol,
      isPublicCompany: stored.isPublicCompany
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Financial Periods Settings Handlers
  const handlePeriodsSettingsChange = (field: string, value: unknown) => {
    // This would update the financial periods settings
  };

  // IFRS Settings Handlers
  const handleIFRSSettingsChange = (field: keyof IFRSSettingsFormData, value: unknown) => {
    setIFRSSettings(prev => ({ ...prev, [field]: value }));
  };

  // Company Settings Handlers
  const handleCompanySettingsChange = (field: keyof CompanySettingsFormData, value: unknown) => {
    if (field === 'address') {
      setCompanySettings(prev => ({ 
        ...prev, 
        address: { ...prev.address, ...value }
      }));
    } else if (field === 'contactInfo') {
      setCompanySettings(prev => ({ 
        ...prev, 
        contactInfo: { ...prev.contactInfo, ...value }
      }));
    } else {
      setCompanySettings(prev => ({ ...prev, [field]: value }));
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setSaveMessage('');

      // Save IFRS Settings
      const ifrsData = {
        ...DEFAULT_IFRS_SETTINGS,
        ...ifrsSettings,
        updatedAt: new Date().toISOString()
      };
      SettingsStorageService.saveIFRSSettings(ifrsData);

      // Save Company Settings
      const companyData = {
        ...DEFAULT_COMPANY_SETTINGS,
        ...companySettings,
        updatedAt: new Date().toISOString()
      };
      SettingsStorageService.saveCompanySettings(companyData);

      setSaveMessage('Settings saved successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Error saving settings. Please try again.');
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // Simulate loading settings data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100); // Reduced delay, let delayed hook handle the rest
    
    return () => clearTimeout(timer);
  }, []);

  const showLoader = useDelayedLoading(isLoading);

  if (showLoader) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" suppressHydrationWarning>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounting Settings</h1>
          <p className="text-muted-foreground">
            Configure financial periods, IFRS compliance, and company information
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving} className="ml-4">
          <SaveIcon className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      {saveMessage && (
        <div className={`p-3 rounded-md ${
          saveMessage.includes('Error') 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {saveMessage}
        </div>
      )}

      <Tabs defaultValue="periods" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="periods" className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4" />
            <span>Financial Periods</span>
          </TabsTrigger>
          <TabsTrigger value="ifrs" className="flex items-center space-x-2">
            <BookOpenIcon className="h-4 w-4" />
            <span>IFRS Compliance</span>
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center space-x-2">
            <BuildingIcon className="h-4 w-4" />
            <span>Company Info</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center space-x-2">
            <UserIcon className="h-4 w-4" />
            <span>User Preferences</span>
          </TabsTrigger>
        </TabsList>

        {/* Financial Periods Settings */}
        <TabsContent value="periods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Financial Year Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure your financial year start date and period management settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fiscalStartMonth">Fiscal Year Start Month</Label>
                  <Select 
                    value={periodsSettings?.fiscalYearStartMonth?.toString() || '1'}
                    onValueChange={(value) => handlePeriodsSettingsChange('fiscalYearStartMonth', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {FISCAL_YEAR_START_MONTHS.map(month => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fiscalStartDay">Fiscal Year Start Day</Label>
                  <Input
                    id="fiscalStartDay"
                    type="number"
                    min="1"
                    max="31"
                    value={periodsSettings?.fiscalYearStartDay || 1}
                    onChange={(e) => handlePeriodsSettingsChange('fiscalYearStartDay', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultPeriodType">Default Period Type</Label>
                  <Select 
                    value={periodsSettings?.defaultPeriodType || 'Annual'}
                    onValueChange={(value) => handlePeriodsSettingsChange('defaultPeriodType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select period type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIOD_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          <div className="flex flex-col">
                            <span>{type}</span>
                            <span className="text-xs text-muted-foreground">
                              {PERIOD_TYPE_DESCRIPTIONS[type]}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-create Periods</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically create periods when a new financial year is added
                    </p>
                  </div>
                  <Switch
                    checked={periodsSettings?.autoCreatePeriods || false}
                    onCheckedChange={(checked) => handlePeriodsSettingsChange('autoCreatePeriods', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Period Closing</Label>
                    <p className="text-sm text-muted-foreground">
                      Require periods to be formally closed before creating new entries
                    </p>
                  </div>
                  <Switch
                    checked={periodsSettings?.requirePeriodClosing || false}
                    onCheckedChange={(checked) => handlePeriodsSettingsChange('requirePeriodClosing', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Prior Period Adjustments</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow reopening and adjusting closed periods
                    </p>
                  </div>
                  <Switch
                    checked={periodsSettings?.allowPriorPeriodAdjustments || false}
                    onCheckedChange={(checked) => handlePeriodsSettingsChange('allowPriorPeriodAdjustments', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IFRS Compliance Settings */}
        <TabsContent value="ifrs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpenIcon className="h-5 w-5" />
                <span>IFRS Compliance Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure IFRS standards, functional currency, and reporting requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="accountingStandard">Accounting Standard</Label>
                  <Select 
                    value={ifrsSettings.accountingStandard}
                    onValueChange={(value) => handleIFRSSettingsChange('accountingStandard', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select accounting standard" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNTING_STANDARDS.map(standard => (
                        <SelectItem key={standard} value={standard}>
                          {standard}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="functionalCurrency">Functional Currency</Label>
                  <Input
                    id="functionalCurrency"
                    value={ifrsSettings.functionalCurrency}
                    onChange={(e) => handleIFRSSettingsChange('functionalCurrency', e.target.value)}
                    placeholder="e.g., USD, EUR, GBP"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="materialityThreshold">Materiality Threshold (%)</Label>
                  <Input
                    id="materialityThreshold"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={ifrsSettings.materialityThreshold}
                    onChange={(e) => handleIFRSSettingsChange('materialityThreshold', parseFloat(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="materialityBasis">Materiality Basis</Label>
                  <Select 
                    value={ifrsSettings.materialityBasis}
                    onValueChange={(value) => handleIFRSSettingsChange('materialityBasis', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select materiality basis" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIALITY_BASIS_OPTIONS.map(basis => (
                        <SelectItem key={basis} value={basis}>
                          {basis}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Reporting Requirements</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="reportingFrequency">Reporting Frequency</Label>
                    <Select 
                      value={ifrsSettings.reportingFrequency}
                      onValueChange={(value) => handleIFRSSettingsChange('reportingFrequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reporting frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {REPORTING_FREQUENCIES.map(frequency => (
                          <SelectItem key={frequency} value={frequency}>
                            {frequency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cashFlowMethod">Cash Flow Method</Label>
                    <Select 
                      value={ifrsSettings.cashFlowMethod}
                      onValueChange={(value) => handleIFRSSettingsChange('cashFlowMethod', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select cash flow method" />
                      </SelectTrigger>
                      <SelectContent>
                        {CASH_FLOW_METHODS.map(method => (
                          <SelectItem key={method} value={method}>
                            <div className="flex flex-col">
                              <span>{method}</span>
                              <span className="text-xs text-muted-foreground">
                                {method === 'Direct' ? 'Recommended by IFRS' : 'Most commonly used'}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Consolidation Required</Label>
                      <p className="text-sm text-muted-foreground">
                        Company has subsidiaries requiring consolidation
                      </p>
                    </div>
                    <Switch
                      checked={ifrsSettings.consolidationRequired}
                      onCheckedChange={(checked) => handleIFRSSettingsChange('consolidationRequired', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Comparative Period Required</Label>
                      <p className="text-sm text-muted-foreground">
                        Include comparative figures in financial statements (IFRS requirement)
                      </p>
                    </div>
                    <Switch
                      checked={ifrsSettings.comparativePeriodRequired}
                      onCheckedChange={(checked) => handleIFRSSettingsChange('comparativePeriodRequired', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>External Audit Required</Label>
                      <p className="text-sm text-muted-foreground">
                        Financial statements require external audit
                      </p>
                    </div>
                    <Switch
                      checked={ifrsSettings.externalAuditRequired}
                      onCheckedChange={(checked) => handleIFRSSettingsChange('externalAuditRequired', checked)}
                    />
                  </div>
                </div>

                {ifrsSettings.externalAuditRequired && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="auditFirm">Audit Firm Name</Label>
                      <Input
                        id="auditFirm"
                        value={ifrsSettings.auditFirmName || ''}
                        onChange={(e) => handleIFRSSettingsChange('auditFirmName', e.target.value)}
                        placeholder="e.g., PwC, Deloitte, KPMG"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="complianceOfficer">Compliance Officer</Label>
                      <Input
                        id="complianceOfficer"
                        value={ifrsSettings.complianceOfficer || ''}
                        onChange={(e) => handleIFRSSettingsChange('complianceOfficer', e.target.value)}
                        placeholder="Name of compliance officer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-md">
                <InfoIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">IFRS Compliance Note</p>
                  <p>These settings help ensure your financial statements comply with International Financial Reporting Standards. Review and update regularly as standards evolve.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Information Settings */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BuildingIcon className="h-5 w-5" />
                <span>Company Information</span>
              </CardTitle>
              <CardDescription>
                Company details used in financial statements and reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companySettings.companyName}
                    onChange={(e) => handleCompanySettingsChange('companyName', e.target.value)}
                    placeholder="Company trading name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Name</Label>
                  <Input
                    id="legalName"
                    value={companySettings.legalName}
                    onChange={(e) => handleCompanySettingsChange('legalName', e.target.value)}
                    placeholder="Full legal company name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={companySettings.registrationNumber}
                    onChange={(e) => handleCompanySettingsChange('registrationNumber', e.target.value)}
                    placeholder="Company registration number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax Identification Number</Label>
                  <Input
                    id="taxId"
                    value={companySettings.taxIdentificationNumber}
                    onChange={(e) => handleCompanySettingsChange('taxIdentificationNumber', e.target.value)}
                    placeholder="Tax ID or VAT number"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Company Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={companySettings.address.street}
                      onChange={(e) => handleCompanySettingsChange('address', { street: e.target.value })}
                      placeholder="Street address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={companySettings.address.city}
                      onChange={(e) => handleCompanySettingsChange('address', { city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={companySettings.address.state}
                      onChange={(e) => handleCompanySettingsChange('address', { state: e.target.value })}
                      placeholder="State or province"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={companySettings.address.postalCode}
                      onChange={(e) => handleCompanySettingsChange('address', { postalCode: e.target.value })}
                      placeholder="Postal/ZIP code"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={companySettings.address.country}
                      onChange={(e) => handleCompanySettingsChange('address', { country: e.target.value })}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Entity Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="entityType">Entity Type</Label>
                    <Select 
                      value={companySettings.entityType}
                      onValueChange={(value) => handleCompanySettingsChange('entityType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENTITY_TYPES.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fiscalYearEnd">Fiscal Year End</Label>
                    <Input
                      id="fiscalYearEnd"
                      value={companySettings.fiscalYearEnd}
                      onChange={(e) => handleCompanySettingsChange('fiscalYearEnd', e.target.value)}
                      placeholder="MM-DD (e.g., 12-31)"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Public Company</Label>
                    <p className="text-sm text-muted-foreground">
                      Company is publicly traded with additional reporting requirements
                    </p>
                  </div>
                  <Switch
                    checked={companySettings.isPublicCompany}
                    onCheckedChange={(checked) => handleCompanySettingsChange('isPublicCompany', checked)}
                  />
                </div>

                {companySettings.isPublicCompany && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="stockExchange">Stock Exchange</Label>
                      <Input
                        id="stockExchange"
                        value={companySettings.stockExchange || ''}
                        onChange={(e) => handleCompanySettingsChange('stockExchange', e.target.value)}
                        placeholder="e.g., NYSE, NASDAQ"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tickerSymbol">Ticker Symbol</Label>
                      <Input
                        id="tickerSymbol"
                        value={companySettings.tickerSymbol || ''}
                        onChange={(e) => handleCompanySettingsChange('tickerSymbol', e.target.value)}
                        placeholder="e.g., AAPL, MSFT"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Preferences Settings */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5" />
                <span>User Preferences</span>
              </CardTitle>
              <CardDescription>
                Customize display settings and personal preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-2 p-3 bg-amber-50 rounded-md">
                <AlertTriangleIcon className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium">Coming Soon</p>
                  <p>User preferences settings will be available in the next update. This will include language, date formats, themes, and notification preferences.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;