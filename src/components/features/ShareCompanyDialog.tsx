import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Share2, Mail, MessageCircle, Download } from "lucide-react";
import { Company } from '@/types/company.types';

interface ShareCompanyDialogProps {
  company: Company | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShareOptions {
  companyInfo: boolean;
  businessDetails: boolean;
  mainContact: boolean;
  mainContactDetails: boolean;
  representatives: boolean;
  shareholders: boolean;
}

export const ShareCompanyDialog: React.FC<ShareCompanyDialogProps> = ({
  company,
  isOpen,
  onOpenChange,
}) => {
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    companyInfo: true,
    businessDetails: true,
    mainContact: true,
    mainContactDetails: true,
    representatives: false,
    shareholders: false,
  });

  if (!company) return null;

  const handleOptionChange = (option: keyof ShareOptions, checked: boolean) => {
    setShareOptions(prev => ({
      ...prev,
      [option]: checked
    }));
  };

  const generateShareContent = () => {
    let content = `${company.tradingName}\n`;
    content += `${company.legalName}\n\n`;

    if (shareOptions.companyInfo) {
      content += "COMPANY INFORMATION\n";
      content += `Registration: ${company.registrationNo}\n`;
      if (company.registrationDate) {
        content += `Registered: ${new Date(company.registrationDate).toLocaleDateString('en-GB')}\n`;
      }
      if (company.countryOfRegistration) {
        content += `Country: ${company.countryOfRegistration}\n`;
      }
      content += `Industry: ${company.industry}\n`;
      content += `Status: ${company.status}\n\n`;
    }

    if (shareOptions.businessDetails) {
      content += "BUSINESS DETAILS\n";
      if (company.baseCurrency) {
        content += `Currency: ${company.baseCurrency}\n`;
      }
      if (company.businessLicenseNr) {
        content += `License: ${company.businessLicenseNr}\n`;
      }
      if (company.vatNumber) {
        content += `VAT: ${company.vatNumber}\n`;
      }
      content += "\n";
    }

    if (shareOptions.mainContact) {
      content += "CONTACT INFORMATION\n";
      if (company.email) {
        content += `Email: ${company.email}\n`;
      }
      if (company.phone) {
        content += `Phone: ${company.phone}\n`;
      }
      if (company.website) {
        content += `Website: ${company.website}\n`;
      }
      if (company.address) {
        content += `Address: ${company.address}\n`;
      }
      
      // Add messengers if available
      if (company.whatsappNumber || company.telegramNumber) {
        content += "\nMessengers:\n";
        if (company.whatsappNumber) {
          content += `WhatsApp: https://wa.me/${company.whatsappNumber}\n`;
        }
        if (company.telegramNumber) {
          const telegramUrl = company.telegramNumber.startsWith('http') 
            ? company.telegramNumber 
            : `https://t.me/${company.telegramNumber}`;
          content += `Telegram: ${telegramUrl}\n`;
        }
      }
      
      // Add social media if available
      if (company.facebookUrl || company.instagramUrl || company.xUrl || company.youtubeUrl) {
        content += "\nSocial Media:\n";
        if (company.facebookUrl) {
          const facebookUrl = company.facebookUrl.startsWith('http') 
            ? company.facebookUrl 
            : `https://${company.facebookUrl}`;
          content += `Facebook: ${facebookUrl}\n`;
        }
        if (company.instagramUrl) {
          const instagramUrl = company.instagramUrl.startsWith('http') 
            ? company.instagramUrl 
            : `https://${company.instagramUrl}`;
          content += `Instagram: ${instagramUrl}\n`;
        }
        if (company.xUrl) {
          const xUrl = company.xUrl.startsWith('http') 
            ? company.xUrl 
            : `https://${company.xUrl}`;
          content += `X (Twitter): ${xUrl}\n`;
        }
        if (company.youtubeUrl) {
          const youtubeUrl = company.youtubeUrl.startsWith('http') 
            ? company.youtubeUrl 
            : `https://${company.youtubeUrl}`;
          content += `YouTube: ${youtubeUrl}\n`;
        }
      }
      content += "\n";
    }

    if (shareOptions.mainContactDetails) {
      content += "CONTACT PERSON\n";
      
      // Try to find the main contact person from representatives or shareholders
      let contactPerson = null;
      
      if (company.mainContactEmail && company.mainContactType) {
        if (company.mainContactType === 'representative' && company.representatives) {
          contactPerson = company.representatives.find(rep => rep.email === company.mainContactEmail);
        } else if (company.mainContactType === 'shareholder' && company.shareholders) {
          contactPerson = company.shareholders.find(sh => sh.email === company.mainContactEmail);
        }
      }
      
      if (contactPerson) {
        // Display full contact person details
        content += `Name: ${contactPerson.firstName} ${contactPerson.lastName}\n`;
        content += `Email: ${contactPerson.email}\n`;
        if (contactPerson.phoneNumber) {
          content += `Phone: ${contactPerson.phoneNumber}\n`;
        }
        
        if (company.mainContactType === 'representative') {
          const role = (contactPerson as any).role === 'Other' ? (contactPerson as any).customRole || 'Other' : (contactPerson as any).role;
          content += `Role: ${role}\n`;
        } else if (company.mainContactType === 'shareholder') {
          content += `Role: Shareholder\n`;
        }
      } else if (company.mainContactEmail && company.mainContactType) {
        // Fallback to basic information if person not found in arrays
        content += `Contact Email: ${company.mainContactEmail}\n`;
        content += `Contact Type: ${company.mainContactType}\n`;
      } else {
        // No main contact details are available
        content += "No specific contact person designated during onboarding\n";
        content += "Please refer to general company contact information above\n";
      }
      content += "\n";
    }

    if (shareOptions.representatives && company.representatives && company.representatives.length > 0) {
      content += "COMPANY REPRESENTATIVES\n";
      company.representatives.forEach((rep, index) => {
        const displayRole = rep.role === 'Other' ? rep.customRole || 'Other' : rep.role;
        content += `${index + 1}. ${rep.firstName} ${rep.lastName} - ${displayRole}\n`;
        content += `   Email: ${rep.email}\n`;
        if (rep.phoneNumber) {
          content += `   Phone: ${rep.phoneNumber}\n`;
        }
      });
      content += "\n";
    }

    if (shareOptions.shareholders && company.shareholders && company.shareholders.length > 0) {
      content += "SHAREHOLDERS\n";
      company.shareholders.forEach((shareholder, index) => {
        content += `${index + 1}. ${shareholder.firstName} ${shareholder.lastName} - ${shareholder.ownershipPercent}% Owner\n`;
        content += `   Email: ${shareholder.email}\n`;
        if (shareholder.phoneNumber) {
          content += `   Phone: ${shareholder.phoneNumber}\n`;
        }
      });
    }

    return content;
  };

  const handleEmailShare = () => {
    const content = generateShareContent();
    const subject = `Company Information: ${company.tradingName}`;
    const emailBody = encodeURIComponent(content);
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${emailBody}`);
  };

  const handleTextShare = () => {
    const content = generateShareContent();
    if (navigator.share) {
      navigator.share({
        title: `${company.tradingName} - Company Information`,
        text: content,
      });
    } else {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(content);
      // You could show a toast notification here
    }
  };


  const selectedCount = Object.values(shareOptions).filter(Boolean).length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Share Company Information</span>
          </DialogTitle>
          <DialogDescription>
            Select the information you want to share for {company.tradingName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Select information to share:</h4>
            
            <div className="space-y-3">
              {/* Company Information Card */}
              <div 
                className={`
                  relative rounded-lg border-2 p-4 cursor-pointer transition-all
                  ${shareOptions.companyInfo 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => handleOptionChange('companyInfo', !shareOptions.companyInfo)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="companyInfo"
                    checked={shareOptions.companyInfo}
                    onCheckedChange={(checked) => handleOptionChange('companyInfo', !!checked)}
                    className="mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div 
                      className="text-sm font-medium cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionChange('companyInfo', !shareOptions.companyInfo);
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
                  ${shareOptions.businessDetails 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => handleOptionChange('businessDetails', !shareOptions.businessDetails)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="businessDetails"
                    checked={shareOptions.businessDetails}
                    onCheckedChange={(checked) => handleOptionChange('businessDetails', !!checked)}
                    className="mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div 
                      className="text-sm font-medium cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionChange('businessDetails', !shareOptions.businessDetails);
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
                  ${shareOptions.mainContact 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => handleOptionChange('mainContact', !shareOptions.mainContact)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="mainContact"
                    checked={shareOptions.mainContact}
                    onCheckedChange={(checked) => handleOptionChange('mainContact', !!checked)}
                    className="mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div 
                      className="text-sm font-medium cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionChange('mainContact', !shareOptions.mainContact);
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
                  ${shareOptions.mainContactDetails 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => handleOptionChange('mainContactDetails', !shareOptions.mainContactDetails)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="mainContactDetails"
                    checked={shareOptions.mainContactDetails}
                    onCheckedChange={(checked) => handleOptionChange('mainContactDetails', !!checked)}
                    className="mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div 
                      className="text-sm font-medium cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionChange('mainContactDetails', !shareOptions.mainContactDetails);
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
                  ${shareOptions.representatives 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => handleOptionChange('representatives', !shareOptions.representatives)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="representatives"
                    checked={shareOptions.representatives}
                    onCheckedChange={(checked) => handleOptionChange('representatives', !!checked)}
                    className="mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div 
                      className="text-sm font-medium cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionChange('representatives', !shareOptions.representatives);
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
                  ${shareOptions.shareholders 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => handleOptionChange('shareholders', !shareOptions.shareholders)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="shareholders"
                    checked={shareOptions.shareholders}
                    onCheckedChange={(checked) => handleOptionChange('shareholders', !!checked)}
                    className="mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div 
                      className="text-sm font-medium cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionChange('shareholders', !shareOptions.shareholders);
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
                Share via ({selectedCount} section{selectedCount !== 1 ? 's' : ''} selected):
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEmailShare}
                  className="flex-1"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTextShare}
                  className="flex-1"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  via App
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};