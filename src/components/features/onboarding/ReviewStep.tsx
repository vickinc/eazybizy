import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Edit,
  AlertTriangle,
  Loader2,
  Hash,
  Calendar,
  FileText,
  Users,
  UserCheck,
  User
} from 'lucide-react';
import { CompanyFormData } from '@/services/business/companyValidationService';

interface ReviewStepProps {
  formData: CompanyFormData;
  logoPreview: string | null;
  isLoading: boolean;
  onPrev: () => void;
  onSubmit: () => void;
  onGoToStep: (step: 'company' | 'business' | 'owners') => void;
  errors: string[];
  isEditing?: boolean;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
  logoPreview,
  isLoading,
  onPrev,
  onSubmit,
  onGoToStep,
  errors,
  isEditing = false
}) => {
  const handleSubmit = () => {
    onSubmit();
  };

  const formatFieldValue = (value: string) => {
    return value || <span className="text-gray-400 italic">Not provided</span>;
  };

  // Social Media Icons
  const FacebookIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );

  const InstagramIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="instagram-gradient-review" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#833ab4"/>
          <stop offset="50%" stopColor="#fd1d1d"/>
          <stop offset="100%" stopColor="#fcb045"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#instagram-gradient-review)"/>
      <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="2"/>
      <circle cx="18" cy="6" r="1.5" fill="white"/>
    </svg>
  );

  const XIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-900">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
    </svg>
  );

  const YoutubeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-600">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );

  const WhatsAppIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.982-3.589c-.597-1.047-.9-2.215-.899-3.411.002-3.813 3.103-6.912 6.914-6.912 1.849.001 3.584.721 4.887 2.025 1.304 1.305 2.023 3.04 2.022 4.889-.002 3.814-3.103 6.878-6.911 6.878z"/>
    </svg>
  );

  const TelegramIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
      <path d="M12 0c-6.626 0-12 5.373-12 12s5.374 12 12 12 12-5.373 12-12-5.374-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
    </svg>
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Confirm</h2>
        <p className="text-gray-600">Please review your company details before submitting</p>
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

      <div className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                Company Information
              </div>
              <Button variant="ghost" size="sm" onClick={() => onGoToStep('company')}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Legal Name</p>
                <p className="text-gray-900">{formatFieldValue(formData.legalName)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Trading Name</p>
                <p className="text-gray-900">{formatFieldValue(formData.tradingName)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Registration Number</p>
                <p className="text-gray-900">{formatFieldValue(formData.registrationNo)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Registration Date</p>
                <p className="text-gray-900">
                  {formData.registrationDate ? 
                    new Date(formData.registrationDate).toLocaleDateString('en-GB') : 
                    <span className="text-gray-400 italic">Not provided</span>
                  }
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Country Of Registration</p>
                <p className="text-gray-900">{formatFieldValue(formData.countryOfRegistration)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Base Currency</p>
                <p className="text-gray-900">{formatFieldValue(formData.baseCurrency)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Business License Nr</p>
                <p className="text-gray-900">{formatFieldValue(formData.businessLicenseNr)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">VAT/GST Number</p>
                <p className="text-gray-900">{formatFieldValue(formData.vatNumber)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Industry</p>
                <p className="text-gray-900">{formatFieldValue(formData.industry)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <Badge variant={formData.status === 'Active' ? 'default' : 'secondary'}>
                  {formData.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-green-600" />
                Contact Information
              </div>
              <Button variant="ghost" size="sm" onClick={() => onGoToStep('business')}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </p>
                <p className="text-gray-900">{formatFieldValue(formData.email)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  Phone
                </p>
                <p className="text-gray-900">{formatFieldValue(formData.phone)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 flex items-center">
                  <Globe className="h-4 w-4 mr-1" />
                  Website
                </p>
                {formData.website ? (
                  <a 
                    href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    {formData.website}
                  </a>
                ) : (
                  <span className="text-gray-400 italic">Not provided</span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Address
                </p>
                <p className="text-gray-900">{formatFieldValue(formData.address)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        {(formData.facebookUrl || formData.instagramUrl || formData.xUrl || formData.youtubeUrl) && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Hash className="h-5 w-5 mr-2 text-green-600" />
                  Social Media
                </div>
                <Button variant="ghost" size="sm" onClick={() => onGoToStep('business')}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.facebookUrl && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      Facebook <FacebookIcon />
                    </p>
                    <a 
                      href={formData.facebookUrl.startsWith('http') ? formData.facebookUrl : `https://${formData.facebookUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {formData.facebookUrl}
                    </a>
                  </div>
                )}
                {formData.instagramUrl && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      Instagram <InstagramIcon />
                    </p>
                    <a 
                      href={formData.instagramUrl.startsWith('http') ? formData.instagramUrl : `https://${formData.instagramUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {formData.instagramUrl}
                    </a>
                  </div>
                )}
                {formData.xUrl && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      X (Twitter) <XIcon />
                    </p>
                    <a 
                      href={formData.xUrl.startsWith('http') ? formData.xUrl : `https://${formData.xUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {formData.xUrl}
                    </a>
                  </div>
                )}
                {formData.youtubeUrl && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      YouTube <YoutubeIcon />
                    </p>
                    <a 
                      href={formData.youtubeUrl.startsWith('http') ? formData.youtubeUrl : `https://${formData.youtubeUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {formData.youtubeUrl}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messengers */}
        {(formData.whatsappNumber || formData.telegramNumber) && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-purple-600" />
                  Messengers
                </div>
                <Button variant="ghost" size="sm" onClick={() => onGoToStep('business')}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.whatsappNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      WhatsApp <WhatsAppIcon />
                    </p>
                    <p className="text-gray-900">{formData.whatsappNumber}</p>
                  </div>
                )}
                {formData.telegramNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      Telegram <TelegramIcon />
                    </p>
                    <p className="text-gray-900">{formData.telegramNumber}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Company Branding */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-5 w-5 mr-2 bg-purple-600 rounded"></div>
                Company Branding
              </div>
              <Button variant="ghost" size="sm" onClick={() => onGoToStep('business')}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Company logo" 
                  className="w-16 h-16 object-cover rounded-lg border shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
                  {formData.tradingName.substring(0, 2).toUpperCase() || 'CO'}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {logoPreview ? 'Custom logo uploaded' : 'Using company initials'}
                </p>
                <p className="text-sm text-gray-500">
                  {logoPreview 
                    ? 'Your logo will appear on invoices and documents' 
                    : 'You can upload a logo later in company settings'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Owners & Representatives */}
        {(formData.shareholders.length > 0 || formData.representatives.length > 0) && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-indigo-600" />
                  Owners & Representatives
                </div>
                <Button variant="ghost" size="sm" onClick={() => onGoToStep('owners')}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Shareholders */}
              {formData.shareholders.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <User className="h-4 w-4 mr-2 text-blue-600" />
                    Shareholders ({formData.shareholders.length})
                  </h4>
                  <div className="space-y-3">
                    {formData.shareholders.map((shareholder, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {shareholder.firstName} {shareholder.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{shareholder.email}</p>
                            {shareholder.phoneNumber && (
                              <p className="text-sm text-gray-600">{shareholder.phoneNumber}</p>
                            )}
                            {(shareholder.nationality || shareholder.countryOfResidence) && (
                              <p className="text-sm text-gray-500">
                                {shareholder.nationality && `Nationality: ${shareholder.nationality}`}
                                {shareholder.nationality && shareholder.countryOfResidence && ' • '}
                                {shareholder.countryOfResidence && `Residence: ${shareholder.countryOfResidence}`}
                              </p>
                            )}
                          </div>
                          <div className="ml-4 text-right">
                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                              {shareholder.ownershipPercent}% ownership
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Total Ownership */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-900">Total Ownership:</span>
                      <span className="font-bold text-blue-900">
                        {formData.shareholders.reduce((total, s) => total + s.ownershipPercent, 0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Representatives */}
              {formData.representatives.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <UserCheck className="h-4 w-4 mr-2 text-purple-600" />
                    Representatives ({formData.representatives.length})
                  </h4>
                  <div className="space-y-3">
                    {formData.representatives.map((rep, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {rep.firstName} {rep.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{rep.email}</p>
                            {rep.phoneNumber && (
                              <p className="text-sm text-gray-600">{rep.phoneNumber}</p>
                            )}
                            {(rep.nationality || rep.countryOfResidence) && (
                              <p className="text-sm text-gray-500">
                                {rep.nationality && `Nationality: ${rep.nationality}`}
                                {rep.nationality && rep.countryOfResidence && ' • '}
                                {rep.countryOfResidence && `Residence: ${rep.countryOfResidence}`}
                              </p>
                            )}
                          </div>
                          <div className="ml-4 text-right">
                            <Badge variant="outline" className="text-purple-600 border-purple-200">
                              {rep.role === 'Other' ? rep.customRole : rep.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Contact Person */}
              {formData.mainContactPerson && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-green-600" />
                    Main Contact Person
                  </h4>
                  <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        {formData.mainContactPerson.type === 'shareholder' ? (
                          <User className="h-4 w-4 text-green-600" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-green-900">
                          {formData.mainContactPerson.firstName} {formData.mainContactPerson.lastName}
                        </p>
                        <p className="text-sm text-green-700 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {formData.mainContactPerson.email}
                        </p>
                        {formData.mainContactPerson.phoneNumber && (
                          <p className="text-sm text-green-700 flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {formData.mainContactPerson.phoneNumber}
                          </p>
                        )}
                        <p className="text-sm text-green-600 font-medium">
                          {formData.mainContactPerson.displayRole} • Primary contact
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button 
          onClick={onPrev} 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEditing ? 'Updating Company...' : 'Creating Company...'}
            </>
          ) : (
            <>
              {isEditing ? 'Update Company' : 'Create Company'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};