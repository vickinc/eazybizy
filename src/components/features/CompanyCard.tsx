import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Phone from "lucide-react/dist/esm/icons/phone";
import Mail from "lucide-react/dist/esm/icons/mail";
import Globe from "lucide-react/dist/esm/icons/globe";
import Copy from "lucide-react/dist/esm/icons/copy";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Check from "lucide-react/dist/esm/icons/check";
import Settings from "lucide-react/dist/esm/icons/settings";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import Download from "lucide-react/dist/esm/icons/download";
import Archive from "lucide-react/dist/esm/icons/archive";
import User from "lucide-react/dist/esm/icons/user";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import { Company } from '@/types';
import { isImageLogo, validateLogo } from '@/utils/logoUtils';
import { calculateCompanyAge } from '@/utils/companyUtils';
import { ShareCompanyDialog } from './ShareCompanyDialog';
import { ArchiveCompanyDialog } from './ArchiveCompanyDialog';
import { DownloadCompanyDialog } from './DownloadCompanyDialog';
import { PDFGenerationService } from '@/services/business/pdfGenerationService';

interface CompanyCardProps {
  company: Company;
  copiedFields: { [key: string]: boolean };
  handleEdit: (company: Company) => void;
  handleDelete: (id: number) => void;
  handleArchive: (company: Company) => void;
  copyToClipboard: (text: string, fieldName: string, companyId: number) => Promise<void>;
  handleWebsiteClick: (website: string, e: React.MouseEvent) => void;
  isPassive?: boolean;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  copiedFields,
  handleEdit,
  handleDelete,
  handleArchive,
  copyToClipboard,
  handleWebsiteClick,
  isPassive = false
}) => {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [isContactPersonExpanded, setIsContactPersonExpanded] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      // Use default options that match the company information dialog
      await PDFGenerationService.generateCompanyPDF(company, {
        includeRepresentatives: true,
        includeShareholders: false,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      // You could show a toast notification here
    }
  };

  const handleMenuItemClick = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    switch (action) {
      case 'share':
        setIsShareDialogOpen(true);
        break;
      case 'download':
        setIsDownloadDialogOpen(true);
        break;
      case 'edit':
        window.location.href = `/companies/company-onboarding?edit=${company.id}`;
        break;
      case 'archive':
        if (company.status === 'Archived') {
          // For archived companies, call unarchive directly
          handleArchive(company);
        } else {
          // For active/passive companies, show confirmation dialog
          setIsArchiveDialogOpen(true);
        }
        break;
      case 'delete':
        handleDelete(company.id);
        break;
    }
  };
  
  return (
    <Card className={`hover:shadow-lg transition-shadow flex flex-col ${isPassive ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden ${
              isImageLogo(company.logo)
                ? '' 
                : 'bg-blue-600'
            }`}>
              {isImageLogo(company.logo) ? (
                <img 
                  src={company.logo} 
                  alt={`${company.tradingName} logo`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-xl">
                  {validateLogo(company.logo, company.tradingName)}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <CardTitle className={`text-lg ${isPassive ? 'text-gray-700' : ''}`}>{company.tradingName}</CardTitle>
                {/* Social Media Icons */}
                <div className="flex items-center space-x-1 ml-2">
                  {company.facebookUrl && (
                    <a
                      href={company.facebookUrl.startsWith('http') ? company.facebookUrl : `https://${company.facebookUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      aria-label={`Visit Facebook page for ${company.tradingName}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                  {company.instagramUrl && (
                    <a
                      href={company.instagramUrl.startsWith('http') ? company.instagramUrl : `https://${company.instagramUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="hover:opacity-80 transition-opacity"
                      aria-label={`Visit Instagram profile for ${company.tradingName}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <defs>
                          <linearGradient id={`instagram-gradient-${company.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#833ab4"/>
                            <stop offset="50%" stopColor="#fd1d1d"/>
                            <stop offset="100%" stopColor="#fcb045"/>
                          </linearGradient>
                        </defs>
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill={`url(#instagram-gradient-${company.id})`}/>
                        <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="2"/>
                        <circle cx="18" cy="6" r="1.5" fill="white"/>
                      </svg>
                    </a>
                  )}
                  {company.xUrl && (
                    <a
                      href={company.xUrl.startsWith('http') ? company.xUrl : `https://${company.xUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-900 hover:text-gray-700 transition-colors"
                      aria-label={`Visit X (Twitter) profile for ${company.tradingName}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                      </svg>
                    </a>
                  )}
                  {company.youtubeUrl && (
                    <a
                      href={company.youtubeUrl.startsWith('http') ? company.youtubeUrl : `https://${company.youtubeUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      aria-label={`Visit YouTube channel for ${company.tradingName}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
              <CardDescription className="text-sm">{company.industry}</CardDescription>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className={company.status === "Active" 
              ? "bg-green-100 text-green-800" 
              : "bg-gray-100 text-gray-800"
            }
          >
            {company.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-6 pt-4">
        <div className="space-y-3 flex-1">
          <div>
            <div className="group flex items-center relative">
              <p 
                className={`font-medium text-sm ${isPassive ? 'text-gray-700' : 'text-gray-900'} cursor-pointer`}
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(company.legalName, 'Legal Name', company.id);
                }}
              >
                {company.legalName}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(company.legalName, 'Legal Name', company.id);
                }}
                aria-label={`Copy legal name: ${company.legalName}`}
              >
                {copiedFields[`${company.id}-Legal Name`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
              </Button>
            </div>
            {/* Entity Type */}
            {company.entityType && (
              <div className="group flex items-center relative">
                <p 
                  className={`text-xs ${isPassive ? 'text-gray-500' : 'text-gray-600'} cursor-pointer`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const entityTypeDisplay = company.entityType === 'Other' && company.customEntityType 
                      ? company.customEntityType 
                      : company.entityType;
                    copyToClipboard(entityTypeDisplay, 'Entity Type', company.id);
                  }}
                >
                  Entity Type: {company.entityType === 'Other' && company.customEntityType 
                    ? company.customEntityType 
                    : company.entityType}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    const entityTypeDisplay = company.entityType === 'Other' && company.customEntityType 
                      ? company.customEntityType 
                      : company.entityType;
                    copyToClipboard(entityTypeDisplay, 'Entity Type', company.id);
                  }}
                  aria-label={`Copy entity type: ${company.entityType === 'Other' && company.customEntityType 
                    ? company.customEntityType 
                    : company.entityType}`}
                >
                  {copiedFields[`${company.id}-Entity Type`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                </Button>
              </div>
            )}
            <div className="group flex items-center relative">
              <p 
                className={`text-xs ${isPassive ? 'text-gray-500' : 'text-gray-600'} cursor-pointer`}
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(company.registrationNo, 'Registration Number', company.id);
                }}
              >
                Registration: {company.registrationNo}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(company.registrationNo, 'Registration Number', company.id);
                }}
                aria-label={`Copy registration number: ${company.registrationNo}`}
              >
                {copiedFields[`${company.id}-Registration Number`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
              </Button>
            </div>
            {/* Always show registration date if it exists */}
            {company.registrationDate && (
              <div className="group flex items-center relative">
                <p 
                  className={`text-xs ${isPassive ? 'text-gray-500' : 'text-gray-600'} cursor-pointer`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const formattedDate = new Date(company.registrationDate).toLocaleDateString('en-GB');
                    copyToClipboard(formattedDate, 'Registration Date', company.id);
                  }}
                >
                  Registered: {new Date(company.registrationDate).toLocaleDateString('en-GB')} {calculateCompanyAge(company.registrationDate).ageString}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    const formattedDate = new Date(company.registrationDate).toLocaleDateString('en-GB');
                    copyToClipboard(formattedDate, 'Registration Date', company.id);
                  }}
                  aria-label={`Copy registration date: ${new Date(company.registrationDate).toLocaleDateString('en-GB')}`}
                >
                  {copiedFields[`${company.id}-Registration Date`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                </Button>
              </div>
            )}
            {/* Always show country if it exists */}
            {company.countryOfRegistration && (
              <div className="group flex items-center relative">
                <p 
                  className={`text-xs ${isPassive ? 'text-gray-500' : 'text-gray-600'} cursor-pointer`}
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(company.countryOfRegistration, 'Country', company.id);
                  }}
                >
                  Country: {company.countryOfRegistration}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(company.countryOfRegistration, 'Country', company.id);
                  }}
                  aria-label={`Copy country: ${company.countryOfRegistration}`}
                >
                  {copiedFields[`${company.id}-Country`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                </Button>
              </div>
            )}
            {/* Always show currency if it exists */}
            {company.baseCurrency && (
              <div className="group flex items-center relative">
                <p 
                  className={`text-xs ${isPassive ? 'text-gray-500' : 'text-gray-600'} cursor-pointer`}
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(company.baseCurrency, 'Base Currency', company.id);
                  }}
                >
                  Currency: {company.baseCurrency}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(company.baseCurrency, 'Base Currency', company.id);
                  }}
                  aria-label={`Copy base currency: ${company.baseCurrency}`}
                >
                  {copiedFields[`${company.id}-Base Currency`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                </Button>
              </div>
            )}
            {/* Always show license if it exists */}
            {company.businessLicenseNr && (
              <div className="group flex items-center relative">
                <p 
                  className={`text-xs ${isPassive ? 'text-gray-500' : 'text-gray-600'} cursor-pointer`}
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(company.businessLicenseNr!, 'Business License', company.id);
                  }}
                >
                  License: {company.businessLicenseNr}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(company.businessLicenseNr!, 'Business License', company.id);
                  }}
                  aria-label={`Copy business license: ${company.businessLicenseNr}`}
                >
                  {copiedFields[`${company.id}-Business License`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                </Button>
              </div>
            )}
            {/* Always show VAT if it exists */}
            {company.vatNumber && (
              <div className="group flex items-center relative">
                <p 
                  className={`text-xs ${isPassive ? 'text-gray-500' : 'text-gray-600'} cursor-pointer`}
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(company.vatNumber!, 'Tax ID', company.id);
                  }}
                >
                  Tax ID: {company.vatNumber}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(company.vatNumber!, 'Tax ID', company.id);
                  }}
                  aria-label={`Copy Tax ID: ${company.vatNumber}`}
                >
                  {copiedFields[`${company.id}-Tax ID`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                </Button>
              </div>
            )}
            {/* Always show Fiscal Year End if it exists */}
            {company.fiscalYearEnd && (
              <div className="group flex items-center relative">
                <p 
                  className={`text-xs ${isPassive ? 'text-gray-500' : 'text-gray-600'} cursor-pointer`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const [month, day] = company.fiscalYearEnd.split('-');
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const displayText = `${monthNames[parseInt(month) - 1]} ${parseInt(day)}`;
                    copyToClipboard(displayText, 'Fiscal Year End', company.id);
                  }}
                >
                  Fiscal Year End: {(() => {
                    const [month, day] = company.fiscalYearEnd.split('-');
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}`;
                  })()}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    const [month, day] = company.fiscalYearEnd.split('-');
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const displayText = `${monthNames[parseInt(month) - 1]} ${parseInt(day)}`;
                    copyToClipboard(displayText, 'Fiscal Year End', company.id);
                  }}
                  aria-label={`Copy fiscal year end: ${(() => {
                    const [month, day] = company.fiscalYearEnd.split('-');
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}`;
                  })()}`}
                >
                  {copiedFields[`${company.id}-Fiscal Year End`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {company.address && company.address.trim() && (
              <div className="group flex items-start space-x-2">
                <MapPin className={`h-4 w-4 ${isPassive ? 'text-gray-400' : 'text-gray-500'} mt-0.5 flex-shrink-0`} />
                <div className="flex items-start flex-1">
                  <p 
                    className={`text-sm ${isPassive ? 'text-gray-500' : 'text-gray-600'} leading-5 cursor-pointer`}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(company.address, 'Address', company.id);
                    }}
                  >
                    {company.address}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 hover:bg-gray-100 mt-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(company.address, 'Address', company.id);
                    }}
                    aria-label={`Copy address: ${company.address}`}
                  >
                    {copiedFields[`${company.id}-Address`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                  </Button>
                </div>
              </div>
            )}
            
            {company.phone && company.phone.trim() && (
              <div className="group flex items-center space-x-2">
                <Phone className={`h-4 w-4 ${isPassive ? 'text-gray-400' : 'text-gray-500'}`} />
                <div className="flex items-center flex-1">
                  <p 
                    className={`text-sm ${isPassive ? 'text-gray-500' : 'text-gray-600'} cursor-pointer`}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(company.phone, 'Phone', company.id);
                    }}
                  >
                    {company.phone}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 hover:bg-gray-100 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(company.phone, 'Phone', company.id);
                    }}
                    aria-label={`Copy phone number: ${company.phone}`}
                  >
                    {copiedFields[`${company.id}-Phone`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Messenger Icons - Show separately if available */}
            {(company.whatsappNumber || company.telegramNumber) && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${isPassive ? 'text-gray-500' : 'text-gray-600'}`}>
                    Messengers:
                  </span>
                  {company.whatsappNumber && (
                    <a
                      href={`https://wa.me/${company.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-green-600 hover:text-green-800 transition-colors"
                      title={`WhatsApp: ${company.whatsappNumber}`}
                      aria-label={`Contact via WhatsApp: ${company.whatsappNumber}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.982-3.589c-.597-1.047-.9-2.215-.899-3.411.002-3.813 3.103-6.912 6.914-6.912 1.849.001 3.584.721 4.887 2.025 1.304 1.305 2.023 3.04 2.022 4.889-.002 3.814-3.103 6.878-6.911 6.878z"/>
                      </svg>
                    </a>
                  )}
                  {company.telegramNumber && (
                    <a
                      href={company.telegramNumber.startsWith('http') ? company.telegramNumber : `https://t.me/${company.telegramNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                      title={`Telegram: ${company.telegramNumber}`}
                      aria-label={`Contact via Telegram: ${company.telegramNumber}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12s5.374 12 12 12 12-5.373 12-12-5.374-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
            
            {company.email && company.email.trim() && (
              <div className="group flex items-center space-x-2">
                <Mail className={`h-4 w-4 ${isPassive ? 'text-gray-400' : 'text-gray-500'}`} />
                <div className="flex items-center flex-1">
                  <p 
                    className={`text-sm ${isPassive ? 'text-gray-500' : 'text-gray-600'} cursor-pointer`}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(company.email, 'Email', company.id);
                    }}
                  >
                    {company.email}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 hover:bg-gray-100 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(company.email, 'Email', company.id);
                    }}
                    aria-label={`Copy email: ${company.email}`}
                  >
                    {copiedFields[`${company.id}-Email`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                  </Button>
                </div>
              </div>
            )}
            
            {company.website && company.website.trim() && (
              <div className="group flex items-center space-x-2">
                <Globe className={`h-4 w-4 ${isPassive ? 'text-gray-400' : 'text-gray-500'}`} />
                <div className="flex items-center flex-1">
                  <p 
                    className={`text-sm ${isPassive ? 'text-gray-500' : 'text-blue-600'} hover:underline cursor-pointer`}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(company.website, 'Website', company.id);
                    }}
                  >
                    {company.website}
                  </p>
                  <div className="flex gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(company.website, 'Website', company.id);
                      }}
                      aria-label={`Copy website: ${company.website}`}
                    >
                      {copiedFields[`${company.id}-Website`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-gray-100"
                      onClick={(e) => handleWebsiteClick(company.website, e)}
                      aria-label={`Visit website: ${company.website}`}
                    >
                      <ExternalLink className="h-3 w-3 text-gray-400" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contact Person Section - Collapsible */}
          {(company.mainContactEmail || company.mainContactType) && (
            <div className="mt-4 pt-4 border-t border-gray-100 bg-lime-100 rounded-lg p-3">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsContactPersonExpanded(!isContactPersonExpanded)}
              >
                <div className="flex items-center space-x-2">
                  <User className={`h-4 w-4 ${isPassive ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${isPassive ? 'text-gray-600' : 'text-gray-700'}`}>
                    Contact Person
                  </span>
                </div>
                {isContactPersonExpanded ? (
                  <ChevronUp className={`h-4 w-4 ${isPassive ? 'text-gray-400' : 'text-gray-500'}`} />
                ) : (
                  <ChevronDown className={`h-4 w-4 ${isPassive ? 'text-gray-400' : 'text-gray-500'}`} />
                )}
              </div>
              
              {isContactPersonExpanded && (
                <div className="mt-3 pl-6 space-y-2">
                  {(() => {
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
                      return (
                        <>
                          <div className="group flex items-center relative">
                            <p 
                              className={`text-sm ${isPassive ? 'text-gray-600' : 'text-gray-700'} cursor-pointer font-medium`}
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(`${contactPerson.firstName} ${contactPerson.lastName}`, 'Contact Person Name', company.id);
                              }}
                            >
                              {contactPerson.firstName} {contactPerson.lastName}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(`${contactPerson.firstName} ${contactPerson.lastName}`, 'Contact Person Name', company.id);
                              }}
                              aria-label={`Copy contact person name: ${contactPerson.firstName} ${contactPerson.lastName}`}
                            >
                              {copiedFields[`${company.id}-Contact Person Name`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                            </Button>
                          </div>
                          
                          <div className="group flex items-center relative">
                            <p 
                              className={`text-xs ${isPassive ? 'text-gray-500' : 'text-gray-600'} cursor-pointer`}
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(contactPerson.email, 'Contact Person Email', company.id);
                              }}
                            >
                              Email: {contactPerson.email}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(contactPerson.email, 'Contact Person Email', company.id);
                              }}
                              aria-label={`Copy contact person email: ${contactPerson.email}`}
                            >
                              {copiedFields[`${company.id}-Contact Person Email`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                            </Button>
                          </div>
                          
                          {contactPerson.phoneNumber && (
                            <div className="group flex items-center relative">
                              <p 
                                className={`text-xs ${isPassive ? 'text-gray-500' : 'text-gray-600'} cursor-pointer`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(contactPerson.phoneNumber, 'Contact Person Phone', company.id);
                                }}
                              >
                                Phone: {contactPerson.phoneNumber}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(contactPerson.phoneNumber, 'Contact Person Phone', company.id);
                                }}
                                aria-label={`Copy contact person phone: ${contactPerson.phoneNumber}`}
                              >
                                {copiedFields[`${company.id}-Contact Person Phone`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                              </Button>
                            </div>
                          )}
                          
                          <div className="group flex items-center relative">
                            <p 
                              className={`text-xs ${isPassive ? 'text-gray-500' : 'text-gray-600'} cursor-pointer`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const role = company.mainContactType === 'representative' 
                                  ? ((contactPerson as any).role === 'Other' ? (contactPerson as any).customRole || 'Other' : (contactPerson as any).role)
                                  : 'Shareholder';
                                copyToClipboard(role, 'Contact Person Role', company.id);
                              }}
                            >
                              Role: {company.mainContactType === 'representative' 
                                ? ((contactPerson as any).role === 'Other' ? (contactPerson as any).customRole || 'Other' : (contactPerson as any).role)
                                : 'Shareholder'
                              }
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                const role = company.mainContactType === 'representative' 
                                  ? ((contactPerson as any).role === 'Other' ? (contactPerson as any).customRole || 'Other' : (contactPerson as any).role)
                                  : 'Shareholder';
                                copyToClipboard(role, 'Contact Person Role', company.id);
                              }}
                              aria-label={`Copy contact person role: ${company.mainContactType === 'representative' 
                                ? ((contactPerson as any).role === 'Other' ? (contactPerson as any).customRole || 'Other' : (contactPerson as any).role)
                                : 'Shareholder'}`}
                            >
                              {copiedFields[`${company.id}-Contact Person Role`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                            </Button>
                          </div>
                        </>
                      );
                    } else if (company.mainContactEmail && company.mainContactType) {
                      return (
                        <>
                          <div className="group flex items-center relative">
                            <p 
                              className={`text-xs ${isPassive ? 'text-gray-500' : 'text-gray-600'} cursor-pointer`}
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(company.mainContactEmail!, 'Contact Email', company.id);
                              }}
                            >
                              Email: {company.mainContactEmail}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(company.mainContactEmail!, 'Contact Email', company.id);
                              }}
                              aria-label={`Copy contact email: ${company.mainContactEmail}`}
                            >
                              {copiedFields[`${company.id}-Contact Email`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                            </Button>
                          </div>
                          
                          <div className="group flex items-center relative">
                            <p 
                              className={`text-xs ${isPassive ? 'text-gray-500' : 'text-gray-600'} cursor-pointer`}
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(company.mainContactType!, 'Contact Type', company.id);
                              }}
                            >
                              Type: {company.mainContactType}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(company.mainContactType!, 'Contact Type', company.id);
                              }}
                              aria-label={`Copy contact type: ${company.mainContactType}`}
                            >
                              {copiedFields[`${company.id}-Contact Type`] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                            </Button>
                          </div>
                        </>
                      );
                    } else {
                      return (
                        <p className={`text-xs ${isPassive ? 'text-gray-500' : 'text-gray-600'}`}>
                          No contact person designated
                        </p>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          )}

        </div>
        
        {/* Action Buttons Section - Always at bottom */}
        <div className="flex justify-center items-center gap-2 pt-4 mt-6 border-t border-gray-200">
          {/* Share Button */}
          <Button 
            variant="ghost" 
            size="sm"
            className="hover:bg-gray-100 hover:-translate-y-0.5 flex items-center gap-1.5 transition-all duration-200"
            onClick={(e) => handleMenuItemClick('share', e)}
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm">Share</span>
          </Button>
          
          {/* Download Button */}
          <Button 
            variant="ghost" 
            size="sm"
            className="hover:bg-gray-100 hover:-translate-y-0.5 flex items-center gap-1.5 transition-all duration-200"
            onClick={(e) => handleMenuItemClick('download', e)}
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Download</span>
          </Button>
          
          {/* Three-dot Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="hover:bg-gray-100"
                onClick={(e) => e.stopPropagation()}
                aria-label={`More actions for ${company.tradingName}`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              <DropdownMenuItem onClick={(e) => handleMenuItemClick('edit', e)}>
                <Settings className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleMenuItemClick('archive', e)}>
                <Archive className="w-4 h-4 mr-2" />
                {company.status === 'Archived' ? 'Unarchive' : 'Archive'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => handleMenuItemClick('delete', e)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
      
      {/* Share Dialog */}
      <ShareCompanyDialog
        company={company}
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
      />
      
      {/* Download Dialog */}
      <DownloadCompanyDialog
        company={company}
        isOpen={isDownloadDialogOpen}
        onOpenChange={setIsDownloadDialogOpen}
      />
      
      {/* Archive Dialog */}
      <ArchiveCompanyDialog
        company={company}
        isOpen={isArchiveDialogOpen}
        onOpenChange={setIsArchiveDialogOpen}
        onConfirmArchive={handleArchive}
      />
    </Card>
  );
};