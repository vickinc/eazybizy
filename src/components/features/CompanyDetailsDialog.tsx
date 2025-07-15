import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Copy from "lucide-react/dist/esm/icons/copy";
import Check from "lucide-react/dist/esm/icons/check";
import Mail from "lucide-react/dist/esm/icons/mail";
import Phone from "lucide-react/dist/esm/icons/phone";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Globe from "lucide-react/dist/esm/icons/globe";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import { Company } from '@/types/company.types';
import { isImageLogo, validateLogo } from '@/utils/logoUtils';

interface CompanyDetailsDialogProps {
  company: Company | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  copiedFields: Record<string, boolean>;
  onCopyToClipboard: (text: string, fieldName: string, companyId: number) => void;
}

export const CompanyDetailsDialog: React.FC<CompanyDetailsDialogProps> = ({
  company,
  isOpen,
  onOpenChange,
  copiedFields,
  onCopyToClipboard,
}) => {
  if (!company) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className={`w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden ${
              isImageLogo(company.logo) ? '' : 'bg-blue-600'
            }`}>
              {isImageLogo(company.logo) ? (
                <img 
                  src={company.logo} 
                  alt={`${company.tradingName} logo`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-lg">
                  {validateLogo(company.logo, company.tradingName)}
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold">{company.tradingName}</p>
              <p className="text-sm text-gray-600">{company.legalName}</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Company information and details
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <p className="text-sm font-medium text-gray-700">Registration No.</p>
                <div className="flex items-center">
                  <p 
                    className="text-sm text-gray-900 cursor-pointer"
                    onClick={() => onCopyToClipboard(company.registrationNo, 'Registration Number', company.id)}
                  >
                    {company.registrationNo}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onCopyToClipboard(company.registrationNo, 'Registration Number', company.id)}
                  >
                    {copiedFields[`${company.id}-Registration Number`] ? 
                      <Check className="h-3 w-3 text-green-500" /> : 
                      <Copy className="h-3 w-3 text-gray-400" />}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                <Badge 
                  className={`${company.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {company.status}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <p className="text-sm font-medium text-gray-700">Registration Date</p>
                <div className="flex items-center">
                  <p 
                    className="text-sm text-gray-900 cursor-pointer"
                    onClick={() => {
                      const formattedDate = company.registrationDate ? 
                        new Date(company.registrationDate).toLocaleDateString('en-GB') : 'N/A';
                      onCopyToClipboard(formattedDate, 'Registration Date', company.id);
                    }}
                  >
                    {company.registrationDate ? new Date(company.registrationDate).toLocaleDateString('en-GB') : 'N/A'}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      const formattedDate = company.registrationDate ? 
                        new Date(company.registrationDate).toLocaleDateString('en-GB') : 'N/A';
                      onCopyToClipboard(formattedDate, 'Registration Date', company.id);
                    }}
                  >
                    {copiedFields[`${company.id}-Registration Date`] ? 
                      <Check className="h-3 w-3 text-green-500" /> : 
                      <Copy className="h-3 w-3 text-gray-400" />}
                  </Button>
                </div>
              </div>
              <div className="group">
                <p className="text-sm font-medium text-gray-700">Country</p>
                <div className="flex items-center">
                  <p 
                    className="text-sm text-gray-900 cursor-pointer"
                    onClick={() => onCopyToClipboard(company.countryOfRegistration || 'N/A', 'Country', company.id)}
                  >
                    {company.countryOfRegistration || 'N/A'}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onCopyToClipboard(company.countryOfRegistration || 'N/A', 'Country', company.id)}
                  >
                    {copiedFields[`${company.id}-Country`] ? 
                      <Check className="h-3 w-3 text-green-500" /> : 
                      <Copy className="h-3 w-3 text-gray-400" />}
                  </Button>
                </div>
              </div>
            </div>

            {company.baseCurrency && (
              <div className="group">
                <p className="text-sm font-medium text-gray-700">Base Currency</p>
                <div className="flex items-center">
                  <p 
                    className="text-sm text-gray-900 cursor-pointer"
                    onClick={() => onCopyToClipboard(company.baseCurrency!, 'Base Currency', company.id)}
                  >
                    {company.baseCurrency}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onCopyToClipboard(company.baseCurrency!, 'Base Currency', company.id)}
                  >
                    {copiedFields[`${company.id}-Base Currency`] ? 
                      <Check className="h-3 w-3 text-green-500" /> : 
                      <Copy className="h-3 w-3 text-gray-400" />}
                  </Button>
                </div>
              </div>
            )}
            
            {company.businessLicenseNr && (
              <div className="group">
                <p className="text-sm font-medium text-gray-700">Business License</p>
                <div className="flex items-center">
                  <p 
                    className="text-sm text-gray-900 cursor-pointer"
                    onClick={() => onCopyToClipboard(company.businessLicenseNr!, 'Business License', company.id)}
                  >
                    {company.businessLicenseNr}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onCopyToClipboard(company.businessLicenseNr!, 'Business License', company.id)}
                  >
                    {copiedFields[`${company.id}-Business License`] ? 
                      <Check className="h-3 w-3 text-green-500" /> : 
                      <Copy className="h-3 w-3 text-gray-400" />}
                  </Button>
                </div>
              </div>
            )}

            {company.vatNumber && (
              <div className="group">
                <p className="text-sm font-medium text-gray-700">VAT Number</p>
                <div className="flex items-center">
                  <p 
                    className="text-sm text-gray-900 cursor-pointer"
                    onClick={() => onCopyToClipboard(company.vatNumber!, 'VAT Number', company.id)}
                  >
                    {company.vatNumber}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onCopyToClipboard(company.vatNumber!, 'VAT Number', company.id)}
                  >
                    {copiedFields[`${company.id}-VAT Number`] ? 
                      <Check className="h-3 w-3 text-green-500" /> : 
                      <Copy className="h-3 w-3 text-gray-400" />}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="group">
              <p className="text-sm font-medium text-gray-700">Industry</p>
              <div className="flex items-center">
                <p 
                  className="text-sm text-gray-900 cursor-pointer"
                  onClick={() => onCopyToClipboard(company.industry, 'Industry', company.id)}
                >
                  {company.industry}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onCopyToClipboard(company.industry, 'Industry', company.id)}
                >
                  {copiedFields[`${company.id}-Industry`] ? 
                    <Check className="h-3 w-3 text-green-500" /> : 
                    <Copy className="h-3 w-3 text-gray-400" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-900">Contact Information</h3>
            
            <div className="group">
              <p className="text-sm font-medium text-gray-700">Address</p>
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
                <div className="flex items-start flex-1">
                  <p 
                    className="text-sm text-gray-900 cursor-pointer"
                    onClick={() => onCopyToClipboard(company.address, 'Address', company.id)}
                  >
                    {company.address}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onCopyToClipboard(company.address, 'Address', company.id)}
                  >
                    {copiedFields[`${company.id}-Address`] ? 
                      <Check className="h-3 w-3 text-green-500" /> : 
                      <Copy className="h-3 w-3 text-gray-400" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <p className="text-sm font-medium text-gray-700">Phone</p>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-500 mr-2" />
                  <p 
                    className="text-sm text-gray-900 cursor-pointer"
                    onClick={() => onCopyToClipboard(company.phone, 'Phone', company.id)}
                  >
                    {company.phone}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onCopyToClipboard(company.phone, 'Phone', company.id)}
                  >
                    {copiedFields[`${company.id}-Phone`] ? 
                      <Check className="h-3 w-3 text-green-500" /> : 
                      <Copy className="h-3 w-3 text-gray-400" />}
                  </Button>
                </div>
              </div>
              <div className="group">
                <p className="text-sm font-medium text-gray-700">Email</p>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-500 mr-2" />
                  <p 
                    className="text-sm text-gray-900 cursor-pointer"
                    onClick={() => onCopyToClipboard(company.email, 'Email', company.id)}
                  >
                    {company.email}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onCopyToClipboard(company.email, 'Email', company.id)}
                  >
                    {copiedFields[`${company.id}-Email`] ? 
                      <Check className="h-3 w-3 text-green-500" /> : 
                      <Copy className="h-3 w-3 text-gray-400" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="group">
              <p className="text-sm font-medium text-gray-700">Website</p>
              <div className="flex items-center">
                <Globe className="h-4 w-4 text-gray-500 mr-2" />
                <a 
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{company.website}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onCopyToClipboard(company.website, 'Website', company.id)}
                >
                  {copiedFields[`${company.id}-Website`] ? 
                    <Check className="h-3 w-3 text-green-500" /> : 
                    <Copy className="h-3 w-3 text-gray-400" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Social Media Section */}
          {(company.facebookUrl || company.instagramUrl || 
            company.xUrl || company.youtubeUrl) && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-900">Social Media</h3>
              <div className="grid grid-cols-2 gap-3">
                {company.facebookUrl && (
                  <div className="group flex items-center">
                    <a
                      href={company.facebookUrl.startsWith('http') ? company.facebookUrl : `https://${company.facebookUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:text-blue-800 transition-colors mr-2"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                    <span 
                      className="text-sm text-gray-900 cursor-pointer"
                      onClick={() => {
                        const url = company.facebookUrl!.startsWith('http') ? 
                          company.facebookUrl! : `https://${company.facebookUrl}`;
                        onCopyToClipboard(url, 'Facebook', company.id);
                      }}
                    >
                      Facebook
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const url = company.facebookUrl!.startsWith('http') ? 
                          company.facebookUrl! : `https://${company.facebookUrl}`;
                        onCopyToClipboard(url, 'Facebook', company.id);
                      }}
                    >
                      {copiedFields[`${company.id}-Facebook`] ? 
                        <Check className="h-3 w-3 text-green-500" /> : 
                        <Copy className="h-3 w-3 text-gray-400" />}
                    </Button>
                  </div>
                )}
                
                {company.instagramUrl && (
                  <div className="group flex items-center">
                    <a
                      href={company.instagramUrl.startsWith('http') ? company.instagramUrl : `https://${company.instagramUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="hover:opacity-80 transition-opacity mr-2"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <defs>
                          <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#833ab4"/>
                            <stop offset="50%" stopColor="#fd1d1d"/>
                            <stop offset="100%" stopColor="#fcb045"/>
                          </linearGradient>
                        </defs>
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#instagram-gradient)"/>
                        <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="2"/>
                        <circle cx="18" cy="6" r="1.5" fill="white"/>
                      </svg>
                    </a>
                    <span 
                      className="text-sm text-gray-900 cursor-pointer"
                      onClick={() => {
                        const url = company.instagramUrl!.startsWith('http') ? 
                          company.instagramUrl! : `https://${company.instagramUrl}`;
                        onCopyToClipboard(url, 'Instagram', company.id);
                      }}
                    >
                      Instagram
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const url = company.instagramUrl!.startsWith('http') ? 
                          company.instagramUrl! : `https://${company.instagramUrl}`;
                        onCopyToClipboard(url, 'Instagram', company.id);
                      }}
                    >
                      {copiedFields[`${company.id}-Instagram`] ? 
                        <Check className="h-3 w-3 text-green-500" /> : 
                        <Copy className="h-3 w-3 text-gray-400" />}
                    </Button>
                  </div>
                )}
                
                {company.xUrl && (
                  <div className="group flex items-center">
                    <a
                      href={company.xUrl.startsWith('http') ? company.xUrl : `https://${company.xUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-900 hover:text-gray-700 transition-colors mr-2"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                      </svg>
                    </a>
                    <span 
                      className="text-sm text-gray-900 cursor-pointer"
                      onClick={() => {
                        const url = company.xUrl!.startsWith('http') ? 
                          company.xUrl! : `https://${company.xUrl}`;
                        onCopyToClipboard(url, 'X', company.id);
                      }}
                    >
                      X (Twitter)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const url = company.xUrl!.startsWith('http') ? 
                          company.xUrl! : `https://${company.xUrl}`;
                        onCopyToClipboard(url, 'X', company.id);
                      }}
                    >
                      {copiedFields[`${company.id}-X`] ? 
                        <Check className="h-3 w-3 text-green-500" /> : 
                        <Copy className="h-3 w-3 text-gray-400" />}
                    </Button>
                  </div>
                )}
                
                {company.youtubeUrl && (
                  <div className="group flex items-center">
                    <a
                      href={company.youtubeUrl.startsWith('http') ? company.youtubeUrl : `https://${company.youtubeUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-red-600 hover:text-red-800 transition-colors mr-2"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </a>
                    <span 
                      className="text-sm text-gray-900 cursor-pointer"
                      onClick={() => {
                        const url = company.youtubeUrl!.startsWith('http') ? 
                          company.youtubeUrl! : `https://${company.youtubeUrl}`;
                        onCopyToClipboard(url, 'YouTube', company.id);
                      }}
                    >
                      YouTube
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const url = company.youtubeUrl!.startsWith('http') ? 
                          company.youtubeUrl! : `https://${company.youtubeUrl}`;
                        onCopyToClipboard(url, 'YouTube', company.id);
                      }}
                    >
                      {copiedFields[`${company.id}-YouTube`] ? 
                        <Check className="h-3 w-3 text-green-500" /> : 
                        <Copy className="h-3 w-3 text-gray-400" />}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messengers Section */}
          {(company.whatsappNumber || company.telegramNumber) && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-900">Messengers</h3>
              <div className="grid grid-cols-2 gap-3">
                {company.whatsappNumber && (
                  <div className="group flex items-center">
                    <a
                      href={`https://wa.me/${company.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-green-600 hover:text-green-800 transition-colors mr-2"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.982-3.589c-.597-1.047-.9-2.215-.899-3.411.002-3.813 3.103-6.912 6.914-6.912 1.849.001 3.584.721 4.887 2.025 1.304 1.305 2.023 3.04 2.022 4.889-.002 3.814-3.103 6.878-6.911 6.878z"/>
                      </svg>
                    </a>
                    <span 
                      className="text-sm text-gray-900 cursor-pointer"
                      onClick={() => {
                        const url = `https://wa.me/${company.whatsappNumber}`;
                        onCopyToClipboard(url, 'WhatsApp', company.id);
                      }}
                    >
                      WhatsApp
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const url = `https://wa.me/${company.whatsappNumber}`;
                        onCopyToClipboard(url, 'WhatsApp', company.id);
                      }}
                    >
                      {copiedFields[`${company.id}-WhatsApp`] ? 
                        <Check className="h-3 w-3 text-green-500" /> : 
                        <Copy className="h-3 w-3 text-gray-400" />}
                    </Button>
                  </div>
                )}
                
                {company.telegramNumber && (
                  <div className="group flex items-center">
                    <a
                      href={company.telegramNumber.startsWith('http') ? company.telegramNumber : `https://t.me/${company.telegramNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-500 hover:text-blue-700 transition-colors mr-2"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12s5.374 12 12 12 12-5.373 12-12-5.374-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                      </svg>
                    </a>
                    <span 
                      className="text-sm text-gray-900 cursor-pointer"
                      onClick={() => {
                        const url = company.telegramNumber!.startsWith('http') ? 
                          company.telegramNumber! : `https://t.me/${company.telegramNumber}`;
                        onCopyToClipboard(url, 'Telegram', company.id);
                      }}
                    >
                      Telegram
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const url = company.telegramNumber!.startsWith('http') ? 
                          company.telegramNumber! : `https://t.me/${company.telegramNumber}`;
                        onCopyToClipboard(url, 'Telegram', company.id);
                      }}
                    >
                      {copiedFields[`${company.id}-Telegram`] ? 
                        <Check className="h-3 w-3 text-green-500" /> : 
                        <Copy className="h-3 w-3 text-gray-400" />}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shareholders Section */}
          {company.shareholders && company.shareholders.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-900">Shareholders (Owners)</h3>
              <div className="space-y-2">
                {company.shareholders.map((shareholder, index) => {
                  const isMainContact = company.mainContactEmail === shareholder.email && 
                                      company.mainContactType === 'shareholder';
                  return (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg ${isMainContact ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            <span 
                              className="cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => onCopyToClipboard(`${shareholder.firstName} ${shareholder.lastName}`, `${shareholder.firstName} ${shareholder.lastName} Name`, company.id)}
                            >
                              {shareholder.firstName} {shareholder.lastName}
                            </span>
                            {isMainContact && (
                              <Badge className="ml-2 bg-green-100 text-green-800">Main Contact</Badge>
                            )}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{shareholder.ownershipPercent}% Owner</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="group flex items-center">
                              <Mail className="h-3 w-3 text-gray-400 mr-1" />
                              <span 
                                className="text-xs text-gray-600 cursor-pointer"
                                onClick={() => onCopyToClipboard(shareholder.email, `${shareholder.firstName} ${shareholder.lastName} Email`, company.id)}
                              >
                                {shareholder.email}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => onCopyToClipboard(shareholder.email, `${shareholder.firstName} ${shareholder.lastName} Email`, company.id)}
                              >
                                {copiedFields[`${company.id}-${shareholder.firstName} ${shareholder.lastName} Email`] ? 
                                  <Check className="h-3 w-3 text-green-500" /> : 
                                  <Copy className="h-3 w-3 text-gray-400" />}
                              </Button>
                            </div>
                            {shareholder.phoneNumber && (
                              <div className="group flex items-center">
                                <Phone className="h-3 w-3 text-gray-400 mr-1" />
                                <span 
                                  className="text-xs text-gray-600 cursor-pointer"
                                  onClick={() => onCopyToClipboard(shareholder.phoneNumber, `${shareholder.firstName} ${shareholder.lastName} Phone`, company.id)}
                                >
                                  {shareholder.phoneNumber}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => onCopyToClipboard(shareholder.phoneNumber, `${shareholder.firstName} ${shareholder.lastName} Phone`, company.id)}
                                >
                                  {copiedFields[`${company.id}-${shareholder.firstName} ${shareholder.lastName} Phone`] ? 
                                    <Check className="h-3 w-3 text-green-500" /> : 
                                    <Copy className="h-3 w-3 text-gray-400" />}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Representatives Section */}
          {company.representatives && company.representatives.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-900">Company Representatives</h3>
              <div className="space-y-2">
                {company.representatives.map((representative, index) => {
                  const isMainContact = company.mainContactEmail === representative.email && 
                                      company.mainContactType === 'representative';
                  const displayRole = representative.role === 'Other' ? 
                    representative.customRole || 'Other' : representative.role;
                  return (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg ${isMainContact ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            <span 
                              className="cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => onCopyToClipboard(`${representative.firstName} ${representative.lastName}`, `${representative.firstName} ${representative.lastName} Name`, company.id)}
                            >
                              {representative.firstName} {representative.lastName}
                            </span>
                            {isMainContact && (
                              <Badge className="ml-2 bg-green-100 text-green-800">Main Contact</Badge>
                            )}
                          </p>
                          <div className="group flex items-center mt-1">
                            <p 
                              className="text-xs text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => onCopyToClipboard(displayRole, `${representative.firstName} ${representative.lastName} Role`, company.id)}
                            >
                              {displayRole}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => onCopyToClipboard(displayRole, `${representative.firstName} ${representative.lastName} Role`, company.id)}
                            >
                              {copiedFields[`${company.id}-${representative.firstName} ${representative.lastName} Role`] ? 
                                <Check className="h-2 w-2 text-green-500" /> : 
                                <Copy className="h-2 w-2 text-gray-400" />}
                            </Button>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="group flex items-center">
                              <Mail className="h-3 w-3 text-gray-400 mr-1" />
                              <span 
                                className="text-xs text-gray-600 cursor-pointer"
                                onClick={() => onCopyToClipboard(representative.email, `${representative.firstName} ${representative.lastName} Email`, company.id)}
                              >
                                {representative.email}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => onCopyToClipboard(representative.email, `${representative.firstName} ${representative.lastName} Email`, company.id)}
                              >
                                {copiedFields[`${company.id}-${representative.firstName} ${representative.lastName} Email`] ? 
                                  <Check className="h-3 w-3 text-green-500" /> : 
                                  <Copy className="h-3 w-3 text-gray-400" />}
                              </Button>
                            </div>
                            {representative.phoneNumber && (
                              <div className="group flex items-center">
                                <Phone className="h-3 w-3 text-gray-400 mr-1" />
                                <span 
                                  className="text-xs text-gray-600 cursor-pointer"
                                  onClick={() => onCopyToClipboard(representative.phoneNumber, `${representative.firstName} ${representative.lastName} Phone`, company.id)}
                                >
                                  {representative.phoneNumber}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => onCopyToClipboard(representative.phoneNumber, `${representative.firstName} ${representative.lastName} Phone`, company.id)}
                                >
                                  {copiedFields[`${company.id}-${representative.firstName} ${representative.lastName} Phone`] ? 
                                    <Check className="h-3 w-3 text-green-500" /> : 
                                    <Copy className="h-3 w-3 text-gray-400" />}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};