import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Download from "lucide-react/dist/esm/icons/download";
import { Company } from '@/types/company.types';
import { PDFGenerationService } from '@/services/business/pdfGenerationService';

interface DownloadCompanyDialogProps {
  company: Company | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DownloadOptions {
  companyInfo: boolean;
  businessDetails: boolean;
  mainContact: boolean;
  mainContactDetails: boolean;
  representatives: boolean;
  shareholders: boolean;
}

export const DownloadCompanyDialog: React.FC<DownloadCompanyDialogProps> = ({
  company,
  isOpen,
  onOpenChange,
}) => {
  const [downloadOptions, setDownloadOptions] = useState<DownloadOptions>({
    companyInfo: true,
    businessDetails: true,
    mainContact: true,
    mainContactDetails: true,
    representatives: false,
    shareholders: false,
  });

  if (!company) return null;

  const handleOptionChange = (option: keyof DownloadOptions, checked: boolean) => {
    setDownloadOptions(prev => ({
      ...prev,
      [option]: checked
    }));
  };

  const handleDownloadPDF = async () => {
    try {
      await PDFGenerationService.generateCompanyPDF(company, {
        includeRepresentatives: downloadOptions.representatives,
        includeShareholders: downloadOptions.shareholders,
        includeContactPerson: downloadOptions.mainContactDetails,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // You could show a toast notification here
    }
  };

  const selectedCount = Object.values(downloadOptions).filter(Boolean).length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Download Company Information</span>
          </DialogTitle>
          <DialogDescription>
            Select the information you want to include in the PDF for {company.tradingName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Select information to include:</h4>
            
            <div className="space-y-3">
              {/* Company Information Card */}
              <div 
                className={`
                  relative rounded-lg border-2 p-4 cursor-pointer transition-all
                  ${downloadOptions.companyInfo 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => handleOptionChange('companyInfo', !downloadOptions.companyInfo)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="companyInfo"
                    checked={downloadOptions.companyInfo}
                    onCheckedChange={(checked) => handleOptionChange('companyInfo', !!checked)}
                    className="mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div 
                      className="text-sm font-medium cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionChange('companyInfo', !downloadOptions.companyInfo);
                      }}
                    >
                      Company Information
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Legal name, trading name, registration number & date, country, status
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Business Details Card */}
              <div 
                className={`
                  relative rounded-lg border-2 p-4 cursor-pointer transition-all
                  ${downloadOptions.businessDetails 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => handleOptionChange('businessDetails', !downloadOptions.businessDetails)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="businessDetails"
                    checked={downloadOptions.businessDetails}
                    onCheckedChange={(checked) => handleOptionChange('businessDetails', !!checked)}
                    className="mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div 
                      className="text-sm font-medium cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionChange('businessDetails', !downloadOptions.businessDetails);
                      }}
                    >
                      Business Details
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Base currency, business license, VAT/GST number, industry
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Contact Information Card */}
              <div 
                className={`
                  relative rounded-lg border-2 p-4 cursor-pointer transition-all
                  ${downloadOptions.mainContact 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => handleOptionChange('mainContact', !downloadOptions.mainContact)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="mainContact"
                    checked={downloadOptions.mainContact}
                    onCheckedChange={(checked) => handleOptionChange('mainContact', !!checked)}
                    className="mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div 
                      className="text-sm font-medium cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionChange('mainContact', !downloadOptions.mainContact);
                      }}
                    >
                      Contact Information
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Email, phone, website, address, social media, messengers
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Contact Person Card */}
              <div 
                className={`
                  relative rounded-lg border-2 p-4 cursor-pointer transition-all
                  ${downloadOptions.mainContactDetails 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => handleOptionChange('mainContactDetails', !downloadOptions.mainContactDetails)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="mainContactDetails"
                    checked={downloadOptions.mainContactDetails}
                    onCheckedChange={(checked) => handleOptionChange('mainContactDetails', !!checked)}
                    className="mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div 
                      className="text-sm font-medium cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionChange('mainContactDetails', !downloadOptions.mainContactDetails);
                      }}
                    >
                      Contact Person
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Main contact person added during company onboarding
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Company Representatives Card */}
              <div 
                className={`
                  relative rounded-lg border-2 p-4 cursor-pointer transition-all
                  ${downloadOptions.representatives 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => handleOptionChange('representatives', !downloadOptions.representatives)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="representatives"
                    checked={downloadOptions.representatives}
                    onCheckedChange={(checked) => handleOptionChange('representatives', !!checked)}
                    className="mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div 
                      className="text-sm font-medium cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionChange('representatives', !downloadOptions.representatives);
                      }}
                    >
                      Company Representatives
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {company.representatives?.length || 0} representative{(company.representatives?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Shareholders Card */}
              <div 
                className={`
                  relative rounded-lg border-2 p-4 cursor-pointer transition-all
                  ${downloadOptions.shareholders 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => handleOptionChange('shareholders', !downloadOptions.shareholders)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="shareholders"
                    checked={downloadOptions.shareholders}
                    onCheckedChange={(checked) => handleOptionChange('shareholders', !!checked)}
                    className="mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div 
                      className="text-sm font-medium cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionChange('shareholders', !downloadOptions.shareholders);
                      }}
                    >
                      Shareholders
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {company.shareholders?.length || 0} shareholder{(company.shareholders?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {selectedCount > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">
                Download PDF ({selectedCount} section{selectedCount !== 1 ? 's' : ''} selected):
              </p>
              <div className="flex space-x-2">
                <Button
                  onClick={handleDownloadPDF}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};