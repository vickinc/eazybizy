import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import Building2 from "lucide-react/dist/esm/icons/building-2";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import Check from "lucide-react/dist/esm/icons/check";
import ChevronsUpDown from "lucide-react/dist/esm/icons/chevrons-up-down";
import Search from "lucide-react/dist/esm/icons/search";
import { CompanyCardPreview } from './CompanyCardPreview';
import { CompanyFormData } from '@/services/business/companyValidationService';
import { COUNTRIES } from '@/types/vendor.types';
import { cn } from '@/utils/index';
import { ENTITY_TYPES } from '@/constants/company.constants';

interface CompanySetupStepProps {
  formData: CompanyFormData;
  logoPreview: string | null;
  onUpdateFormData: (updates: Partial<CompanyFormData>) => void;
  onNext: () => void;
  canProceed: boolean;
  errors: string[];
  isEditing?: boolean;
}

export const CompanySetupStep: React.FC<CompanySetupStepProps> = ({
  formData,
  logoPreview,
  onUpdateFormData,
  onNext,
  canProceed,
  errors,
  isEditing = false
}) => {
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);
  const [isAdditionalInfoExpanded, setIsAdditionalInfoExpanded] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onUpdateFormData({ [name]: value });
  };

  const handleStatusChange = (value: string) => {
    onUpdateFormData({ status: value });
  };

  const toggleHelp = () => {
    setIsHelpExpanded(prev => !prev);
  };

  const toggleAdditionalInfo = () => {
    setIsAdditionalInfoExpanded(prev => !prev);
  };

  // Currency list with names and codes
  const currencies = [
    { name: 'United States Dollar', code: 'USD' },
    { name: 'Euro', code: 'EUR' },
    { name: 'Japanese Yen', code: 'JPY' },
    { name: 'Pound Sterling', code: 'GBP' },
    { name: 'Chinese Yuan', code: 'CNY' },
    { name: 'Canadian Dollar', code: 'CAD' },
    { name: 'Australian Dollar', code: 'AUD' },
    { name: 'Swiss Franc', code: 'CHF' },
    { name: 'Hong Kong Dollar', code: 'HKD' },
    { name: 'Singapore Dollar', code: 'SGD' },
    { name: 'New Zealand Dollar', code: 'NZD' },
    { name: 'Indian Rupee', code: 'INR' },
    { name: 'South African Rand', code: 'ZAR' },
    { name: 'South Korean Won', code: 'KRW' },
    { name: 'Mexican Peso', code: 'MXN' },
    { name: 'Norwegian Krone', code: 'NOK' },
    { name: 'Swedish Krona', code: 'SEK' },
    { name: 'Russian Ruble', code: 'RUB' },
    { name: 'Brazilian Real', code: 'BRL' },
    { name: 'Saudi Riyal', code: 'SAR' },
    { name: 'United Arab Emirates Dirham', code: 'AED' },
    { name: 'Bahraini Dinar', code: 'BHD' },
    { name: 'Omani Rial', code: 'OMR' },
    { name: 'Qatari Riyal', code: 'QAR' },
    { name: 'Kuwaiti Dinar', code: 'KWD' },
    { name: 'Jordanian Dinar', code: 'JOD' },
    { name: 'Bahamian Dollar', code: 'BSD' },
    { name: 'Belize Dollar', code: 'BZD' },
    { name: 'Cayman Islands Dollar', code: 'KYD' },
    { name: 'Aruban Florin', code: 'AWG' },
    { name: 'Netherlands Antillean Guilder', code: 'ANG' },
    { name: 'East Caribbean Dollar', code: 'XCD' },
    { name: 'Barbadian Dollar', code: 'BBD' },
    { name: 'Bermudian Dollar', code: 'BMD' },
    { name: 'Lebanese Pound', code: 'LBP' },
    { name: 'Cambodian Riel', code: 'KHR' },
    { name: 'Nicaraguan Córdoba', code: 'NIO' },
    { name: 'Guyanese Dollar', code: 'GYD' },
    { name: 'Trinidad and Tobago Dollar', code: 'TTD' },
    { name: 'Honduran Lempira', code: 'HNL' },
    { name: 'Djiboutian Franc', code: 'DJF' },
    { name: 'Eritrean Nakfa', code: 'ERN' },
    { name: 'Iraqi Dinar', code: 'IQD' },
    { name: 'Malaysian Ringgit', code: 'MYR' },
    { name: 'Thai Baht', code: 'THB' },
    { name: 'Vietnamese Dong', code: 'VND' },
    { name: 'Turkish Lira', code: 'TRY' },
    { name: 'Nigerian Naira', code: 'NGN' },
    { name: 'Ghanaian Cedi', code: 'GHS' },
    { name: 'Kenyan Shilling', code: 'KES' },
  ];

  // Filter countries based on search input (starts with)
  const filteredCountries = COUNTRIES.filter(country =>
    country.toLowerCase().startsWith(countrySearch.toLowerCase())
  );

  // Filter currencies based on search input (searches both name and code)
  const filteredCurrencies = currencies.filter(currency =>
    currency.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
    currency.code.toLowerCase().includes(currencySearch.toLowerCase())
  );

  // Find selected currency display text
  const selectedCurrency = currencies.find(currency => currency.code === formData.baseCurrency);
  const currencyDisplayText = selectedCurrency ? `${selectedCurrency.code} - ${selectedCurrency.name}` : "Select base currency";

  // Common industry suggestions
  const industryOptions = [
    'Technology',
    'Healthcare',
    'Finance',
    'Manufacturing',
    'Retail',
    'Consulting',
    'Education',
    'Real Estate',
    'Transportation',
    'Marketing & Advertising',
    'Food & Beverage',
    'Construction',
    'Professional Services',
    'Entertainment',
    'Non-profit',
    'Other'
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        {isEditing && (
          <div className="flex justify-start mb-6">
            <Button 
              onClick={() => window.location.href = '/companies'}
              className="flex items-center bg-lime-200 hover:bg-lime-300 border border-lime-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Companies
            </Button>
          </div>
        )}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Information</h2>
        <p className="text-gray-600">Let's start with the basic details about your company</p>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="space-y-6">
          {/* Required Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Required Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Legal Name */}
          <div className="md:col-span-2">
            <Label htmlFor="legalName">Legal Company Name *</Label>
            <Input
              id="legalName"
              name="legalName"
              value={formData.legalName}
              onChange={handleInputChange}
              placeholder="Enter the official legal name of your company"
              className="mt-1 bg-lime-50 border-lime-200 focus:bg-white"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This should match your official business registration
            </p>
          </div>

          {/* Entity Type */}
          <div>
            <Label htmlFor="entityType">Entity Type *</Label>
            <Select
              value={formData.entityType || ''}
              onValueChange={(value) => {
                onUpdateFormData({ 
                  entityType: value,
                  customEntityType: value === 'Other' ? formData.customEntityType : undefined
                });
              }}
            >
              <SelectTrigger id="entityType" className="mt-1 bg-lime-50 border-lime-200 hover:bg-lime-100">
                <SelectValue placeholder="Select entity type" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Legal structure of your business
            </p>
          </div>

          {/* Custom Entity Type (if Other is selected) */}
          {formData.entityType === 'Other' && (
            <div>
              <Label htmlFor="customEntityType">Specify Entity Type *</Label>
              <Input
                id="customEntityType"
                name="customEntityType"
                value={formData.customEntityType || ''}
                onChange={handleInputChange}
                placeholder="Enter custom entity type"
                className="mt-1 bg-lime-50 border-lime-200 focus:bg-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Please specify your entity type
              </p>
            </div>
          )}

          {/* Trading Name */}
          <div className="md:col-span-2">
            <Label htmlFor="tradingName">Trading Name *</Label>
            <Input
              id="tradingName"
              name="tradingName"
              value={formData.tradingName}
              onChange={handleInputChange}
              placeholder="Enter the name you do business under"
              className="mt-1 bg-lime-50 border-lime-200 focus:bg-white"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This is the name your customers will know you by
            </p>
          </div>

          {/* Registration Number */}
          <div>
            <Label htmlFor="registrationNo">Registration Number *</Label>
            <Input
              id="registrationNo"
              name="registrationNo"
              value={formData.registrationNo}
              onChange={handleInputChange}
              placeholder="e.g., 12345678"
              className="mt-1 bg-lime-50 border-lime-200 focus:bg-white"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Your official business registration number
            </p>
          </div>

          {/* Registration Date */}
          <div>
            <Label htmlFor="registrationDate">Registration Date *</Label>
            <Input
              id="registrationDate"
              name="registrationDate"
              type="date"
              value={formData.registrationDate}
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]}
              className="mt-1 bg-lime-50 border-lime-200 focus:bg-white"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Date when your company was officially registered (cannot be in the future)
            </p>
          </div>

          {/* Country Of Registration */}
          <div>
            <Label htmlFor="countryOfRegistration">Country Of Registration *</Label>
            <Popover open={countryOpen} onOpenChange={(open) => {
              setCountryOpen(open);
              if (!open) setCountrySearch(''); // Reset search when closing
            }}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={countryOpen}
                  className="w-full justify-between mt-1 font-normal bg-lime-50 hover:bg-lime-100 border-lime-200"
                >
                  {formData.countryOfRegistration || "Select country..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <div className="flex items-center border-b px-3">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <Input
                    placeholder="Search country..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="h-8 border-0 focus:ring-0 px-0"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredCountries.length === 0 ? (
                    <div className="py-6 text-center text-sm">No country found.</div>
                  ) : (
                    filteredCountries.map((country) => (
                      <div
                        key={country}
                        className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          onUpdateFormData({ countryOfRegistration: country });
                          setCountryOpen(false);
                          setCountrySearch('');
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.countryOfRegistration === country ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {country}
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-gray-500 mt-1">
              Country where your company is legally registered
            </p>
          </div>

          {/* Base Currency */}
          <div>
            <Label htmlFor="baseCurrency">Base Currency *</Label>
            <Popover open={currencyOpen} onOpenChange={(open) => {
              setCurrencyOpen(open);
              if (!open) setCurrencySearch(''); // Reset search when closing
            }}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={currencyOpen}
                  className="w-full justify-between mt-1 font-normal bg-lime-50 hover:bg-lime-100 border-lime-200"
                >
                  {currencyDisplayText}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <div className="flex items-center border-b px-3">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <Input
                    placeholder="Search currency..."
                    value={currencySearch}
                    onChange={(e) => setCurrencySearch(e.target.value)}
                    className="h-8 border-0 focus:ring-0 px-0"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredCurrencies.length === 0 ? (
                    <div className="py-6 text-center text-sm">No currency found.</div>
                  ) : (
                    filteredCurrencies.map((currency) => (
                      <div
                        key={currency.code}
                        className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          onUpdateFormData({ baseCurrency: currency.code });
                          setCurrencyOpen(false);
                          setCurrencySearch('');
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.baseCurrency === currency.code ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{currency.code}</span>
                          <span className="text-xs text-gray-500">{currency.name}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-gray-500 mt-1">
              Currency for Financial Reporting
            </p>
          </div>

              {/* Company Status */}
              <div>
                <Label htmlFor="status">Company Status *</Label>
                <Select value={formData.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="mt-1 bg-lime-50 border-lime-200 focus:bg-white">
                    <SelectValue placeholder="Select company status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Passive">Passive</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Active companies are currently operating
                </p>
              </div>
            </div>
          </div>

      {/* Additional Information - Collapsible */}
      <Collapsible open={isAdditionalInfoExpanded} onOpenChange={setIsAdditionalInfoExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-lime-200 hover:bg-lime-300 border-lime-300"
            type="button"
          >
            <span className="font-semibold">Additional Information</span>
            {isAdditionalInfoExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business License Number */}
            <div>
              <Label htmlFor="businessLicenseNr">Business License Number</Label>
              <Input
                id="businessLicenseNr"
                name="businessLicenseNr"
                value={formData.businessLicenseNr}
                onChange={handleInputChange}
                placeholder="e.g., BL-123456"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your business license number (if applicable)
              </p>
            </div>

            {/* VAT/GST Number */}
            <div>
              <Label htmlFor="vatNumber">VAT/GST Number</Label>
              <Input
                id="vatNumber"
                name="vatNumber"
                value={formData.vatNumber}
                onChange={handleInputChange}
                placeholder="e.g., GB123456789"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your VAT/GST registration number (if applicable)
              </p>
            </div>

            {/* Fiscal Year End */}
            <div className="md:col-span-2">
              <Label htmlFor="fiscalYearEnd">Fiscal Year End</Label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div>
                  <Select 
                    value={formData.fiscalYearEnd?.split('-')[0] || undefined} 
                    onValueChange={(month) => {
                      if (month) {
                        const day = formData.fiscalYearEnd?.split('-')[1] || '31';
                        onUpdateFormData({ fiscalYearEnd: `${month}-${day}` });
                      } else {
                        onUpdateFormData({ fiscalYearEnd: '' });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Month (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="01">January</SelectItem>
                      <SelectItem value="02">February</SelectItem>
                      <SelectItem value="03">March</SelectItem>
                      <SelectItem value="04">April</SelectItem>
                      <SelectItem value="05">May</SelectItem>
                      <SelectItem value="06">June</SelectItem>
                      <SelectItem value="07">July</SelectItem>
                      <SelectItem value="08">August</SelectItem>
                      <SelectItem value="09">September</SelectItem>
                      <SelectItem value="10">October</SelectItem>
                      <SelectItem value="11">November</SelectItem>
                      <SelectItem value="12">December</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select 
                    value={formData.fiscalYearEnd?.split('-')[1] || undefined} 
                    onValueChange={(day) => {
                      const month = formData.fiscalYearEnd?.split('-')[0];
                      if (month && day) {
                        onUpdateFormData({ fiscalYearEnd: `${month}-${day}` });
                      }
                    }}
                    disabled={!formData.fiscalYearEnd?.split('-')[0]}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString().padStart(2, '0')}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select the last day of your financial year (e.g., December 31 for calendar year)
              </p>
            </div>

            {/* Industry */}
            <div className="md:col-span-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={formData.industry} onValueChange={(value) => onUpdateFormData({ industry: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {industryOptions.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Choose the industry that best describes your business
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

          {/* Help Section */}
          <div 
            className="bg-lime-50 border border-lime-200 rounded-lg p-3 cursor-pointer transition-colors hover:bg-lime-100" 
            onClick={toggleHelp}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">Need Help?</span>
              {isHelpExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              )}
            </div>
            {isHelpExpanded && (
              <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                <ul className="text-xs text-gray-700 space-y-2">
                  <li>• <strong>Legal Name:</strong> The name registered with government authorities</li>
                  <li>• <strong>Trading Name:</strong> The name used for marketing and customer interactions</li>
                  <li>• <strong>Registration Number:</strong> Your official business registration or company number (required)</li>
                  <li>• <strong>Registration Date:</strong> The date when your company was officially registered with authorities (required)</li>
                  <li>• <strong>Country Of Registration:</strong> The country where your company is legally registered with authorities (required)</li>
                  <li>• <strong>Base Currency:</strong> The primary currency used for financial reporting and accounting (required)</li>
                  <li>• <strong>Business License Number:</strong> Additional license number if your business requires specific licensing (optional)</li>
                  <li>
                    • <strong>VAT/GST Number:</strong> Value Added Tax (VAT) or Goods and Services Tax (GST) registration number.
                    <br />
                    <span className="ml-3">VAT is used in EU and other countries, GST is used in countries like Australia, Canada, and India.</span>
                    <br />
                    <span className="ml-3">Only required if you&apos;re registered for these taxes.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Preview Section */}
        <div className="lg:sticky lg:top-8 h-fit">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
          <div className="max-h-[600px] overflow-hidden">
            <CompanyCardPreview 
              formData={formData} 
              logoPreview={logoPreview} 
            />
          </div>
          <p className="text-xs text-gray-600 mt-1 text-center">This is how your company card will appear</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6">
        <Button 
          onClick={onNext}
          disabled={!canProceed}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Next: Business Details
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};