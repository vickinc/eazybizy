import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Phone from "lucide-react/dist/esm/icons/phone";
import Mail from "lucide-react/dist/esm/icons/mail";
import Globe from "lucide-react/dist/esm/icons/globe";
import { CompanyFormData } from '@/services/business/companyValidationService';
import { isImageLogo, validateLogo } from '@/utils/logoUtils';
import { calculateCompanyAge } from '@/utils/companyUtils';

interface CompanyCardPreviewProps {
  formData: CompanyFormData;
  logoPreview: string | null;
}

export const CompanyCardPreview: React.FC<CompanyCardPreviewProps> = ({
  formData,
  logoPreview
}) => {
  // Determine the logo to display
  const displayLogo = logoPreview || formData.logo;
  
  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col bg-white border-lime-200 mt-2 mx-2 mb-6">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden ${
              isImageLogo(displayLogo)
                ? '' 
                : 'bg-gradient-to-br from-blue-500 to-purple-600'
            }`}>
              {isImageLogo(displayLogo) ? (
                <img 
                  src={displayLogo} 
                  alt={`${formData.tradingName || 'Company'} logo`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-xl">
                  {validateLogo(displayLogo, formData.tradingName || 'CO')}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{formData.tradingName || 'Your Company'}</CardTitle>
                {/* Social Media Icons */}
                <div className="flex items-center space-x-1 ml-2">
                  {formData.facebookUrl && (
                    <a
                      href={formData.facebookUrl.startsWith('http') ? formData.facebookUrl : `https://${formData.facebookUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.preventDefault()}
                      className="text-blue-600 hover:text-blue-800 transition-colors cursor-default"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                  {formData.instagramUrl && (
                    <a
                      href={formData.instagramUrl.startsWith('http') ? formData.instagramUrl : `https://${formData.instagramUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.preventDefault()}
                      className="hover:opacity-80 transition-opacity cursor-default"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <defs>
                          <linearGradient id="instagram-gradient-preview" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#833ab4"/>
                            <stop offset="50%" stopColor="#fd1d1d"/>
                            <stop offset="100%" stopColor="#fcb045"/>
                          </linearGradient>
                        </defs>
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#instagram-gradient-preview)"/>
                        <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="2"/>
                        <circle cx="18" cy="6" r="1.5" fill="white"/>
                      </svg>
                    </a>
                  )}
                  {formData.xUrl && (
                    <a
                      href={formData.xUrl.startsWith('http') ? formData.xUrl : `https://${formData.xUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.preventDefault()}
                      className="text-gray-900 hover:text-gray-700 transition-colors cursor-default"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                      </svg>
                    </a>
                  )}
                  {formData.youtubeUrl && (
                    <a
                      href={formData.youtubeUrl.startsWith('http') ? formData.youtubeUrl : `https://${formData.youtubeUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.preventDefault()}
                      className="text-red-600 hover:text-red-800 transition-colors cursor-default"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
              <CardDescription className="text-sm">{formData.industry || 'Industry'}</CardDescription>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className={formData.status === "Active" 
              ? "bg-green-100 text-green-800" 
              : "bg-gray-100 text-gray-800"
            }
          >
            {formData.status || 'Active'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-6 pt-0">
        <div className="space-y-3 flex-1">
          <div>
            <div className="group flex items-center relative">
              <p className="font-medium text-sm text-gray-900">
                {formData.legalName || 'Legal Company Name'}
              </p>
            </div>
            {formData.entityType && (
              <div className="group flex items-center relative">
                <p className="text-xs text-gray-600">
                  Entity Type: {formData.entityType === 'Other' && formData.customEntityType 
                    ? formData.customEntityType 
                    : formData.entityType}
                </p>
              </div>
            )}
            <div className="group flex items-center relative">
              <p className="text-xs text-gray-600">
                Registration: {formData.registrationNo || 'REG-XXXXX'}
              </p>
            </div>
            {formData.registrationDate && (
              <div className="group flex items-center relative">
                <p className="text-xs text-gray-600">
                  Registered: {new Date(formData.registrationDate).toLocaleDateString('en-GB')} {calculateCompanyAge(formData.registrationDate).ageString}
                </p>
              </div>
            )}
            {formData.countryOfRegistration && (
              <div className="group flex items-center relative">
                <p className="text-xs text-gray-600">
                  Country: {formData.countryOfRegistration}
                </p>
              </div>
            )}
            {formData.baseCurrency && (
              <div className="group flex items-center relative">
                <p className="text-xs text-gray-600">
                  Currency: {formData.baseCurrency}
                </p>
              </div>
            )}
            {formData.businessLicenseNr && (
              <div className="group flex items-center relative">
                <p className="text-xs text-gray-600">
                  License: {formData.businessLicenseNr}
                </p>
              </div>
            )}
            {formData.vatNumber && (
              <div className="group flex items-center relative">
                <p className="text-xs text-gray-600">
                  VAT: {formData.vatNumber}
                </p>
              </div>
            )}
            {formData.fiscalYearEnd && (
              <div className="group flex items-center relative">
                <p className="text-xs text-gray-600">
                  Fiscal Year End: {(() => {
                    const [month, day] = formData.fiscalYearEnd.split('-');
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}`;
                  })()}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {formData.address && formData.address.trim() && (
              <div className="group flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex items-start flex-1">
                  <p className="text-sm text-gray-600 leading-5">
                    {formData.address}
                  </p>
                </div>
              </div>
            )}
            
            {formData.phone && formData.phone.trim() && (
              <div className="group flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <div className="flex items-center flex-1">
                  <p className="text-sm text-gray-600">
                    {formData.phone}
                  </p>
                  {/* Messenger Icons */}
                  {formData.whatsappNumber && (
                    <span className="ml-2 text-green-600" title={`WhatsApp: https://wa.me/${formData.whatsappNumber}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.982-3.589c-.597-1.047-.9-2.215-.899-3.411.002-3.813 3.103-6.912 6.914-6.912 1.849.001 3.584.721 4.887 2.025 1.304 1.305 2.023 3.04 2.022 4.889-.002 3.814-3.103 6.878-6.911 6.878z"/>
                      </svg>
                    </span>
                  )}
                  {formData.telegramNumber && (
                    <span className="ml-1 text-blue-500">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12s5.374 12 12 12 12-5.373 12-12-5.374-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {formData.email && formData.email.trim() && (
              <div className="group flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <div className="flex items-center flex-1">
                  <p className="text-sm text-gray-600">
                    {formData.email}
                  </p>
                </div>
              </div>
            )}
            
            {formData.website && formData.website.trim() && (
              <div className="group flex items-center space-x-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <div className="flex items-center flex-1">
                  <p className="text-sm text-blue-600">
                    {formData.website}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
        
        {/* Button Section Placeholder - Shows where buttons would be */}
        <div className="flex space-x-2 pt-6 mt-8 border-t border-gray-200">
          <div className="flex-1 bg-gray-100 rounded h-9"></div>
          <div className="w-9 bg-gray-100 rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
};