import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Phone, Globe, MapPin, ArrowRight, ArrowLeft, Upload, X, AlertTriangle, Hash } from 'lucide-react';
import { CompanyCardPreview } from './CompanyCardPreview';
import { CompanyFormData } from '@/services/business/companyValidationService';

interface BusinessDetailsStepProps {
  formData: CompanyFormData;
  logoPreview: string | null;
  onUpdateFormData: (updates: Partial<CompanyFormData>) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
  onNext: () => void;
  onPrev: () => void;
  canProceed: boolean;
  errors: string[];
}

export const BusinessDetailsStep: React.FC<BusinessDetailsStepProps> = ({
  formData,
  logoPreview,
  onUpdateFormData,
  onLogoUpload,
  onRemoveLogo,
  onNext,
  onPrev,
  canProceed,
  errors
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onUpdateFormData({ [name]: value });
  };

  // Social Media Icons
  const FacebookIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );

  const InstagramIcon = () => (
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
  );

  const XIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-900">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
    </svg>
  );

  const YoutubeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-600">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );

  const WhatsAppIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.982-3.589c-.597-1.047-.9-2.215-.899-3.411.002-3.813 3.103-6.912 6.914-6.912 1.849.001 3.584.721 4.887 2.025 1.304 1.305 2.023 3.04 2.022 4.889-.002 3.814-3.103 6.878-6.911 6.878z"/>
    </svg>
  );

  const TelegramIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
      <path d="M12 0c-6.626 0-12 5.373-12 12s5.374 12 12 12 12-5.373 12-12-5.374-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
    </svg>
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Details</h2>
        <p className="text-gray-600">Add contact information and company branding</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Information */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2 text-blue-600" />
              Contact Information
            </h3>
            
            <div className="space-y-4">
              {/* Email */}
              <div>
                <Label htmlFor="email">Business Email *</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="hello@yourcompany.com"
                    className="pl-10 bg-lime-50 border-lime-200 focus:bg-white"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Main contact email for your business
                </p>
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Business phone number for customer contact
                </p>
              </div>

              {/* Website */}
              <div>
                <Label htmlFor="website">Website</Label>
                <div className="relative mt-1">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://www.yourcompany.com"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Your company website URL (optional)
                </p>
              </div>

              {/* Address */}
              <div>
                <Label htmlFor="address">Business Address</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Business St, City, State 12345"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Physical address of your business
                </p>
              </div>
            </div>
          </div>

          {/* Messengers Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2 text-purple-600" />
              Messengers
            </h3>
            
            <div className="space-y-4">
              {/* WhatsApp */}
              <div>
                <Label htmlFor="whatsappNumber">WhatsApp</Label>
                <div className="relative mt-1">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <WhatsAppIcon />
                  </div>
                  <Input
                    id="whatsappNumber"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleInputChange}
                    placeholder="1XXXXXXXXXX (international format, no +, spaces, or brackets)"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Phone number in international format (no +, spaces, brackets, or dashes)
                </p>
              </div>

              {/* Telegram */}
              <div>
                <Label htmlFor="telegramNumber">Telegram</Label>
                <div className="relative mt-1">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <TelegramIcon />
                  </div>
                  <Input
                    id="telegramNumber"
                    name="telegramNumber"
                    value={formData.telegramNumber}
                    onChange={handleInputChange}
                    placeholder="https://t.me/username"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Telegram username link for business messaging
                </p>
              </div>
            </div>
          </div>

          {/* Social Media Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Hash className="h-5 w-5 mr-2 text-green-600" />
              Social Media
            </h3>
            
            <div className="space-y-4">
              {/* Facebook */}
              <div>
                <Label htmlFor="facebookUrl">Facebook</Label>
                <div className="relative mt-1">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <FacebookIcon />
                  </div>
                  <Input
                    id="facebookUrl"
                    name="facebookUrl"
                    value={formData.facebookUrl}
                    onChange={handleInputChange}
                    placeholder="https://facebook.com/yourcompany"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Instagram */}
              <div>
                <Label htmlFor="instagramUrl">Instagram</Label>
                <div className="relative mt-1">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <InstagramIcon />
                  </div>
                  <Input
                    id="instagramUrl"
                    name="instagramUrl"
                    value={formData.instagramUrl}
                    onChange={handleInputChange}
                    placeholder="https://instagram.com/yourcompany"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* X (Twitter) */}
              <div>
                <Label htmlFor="xUrl">X (Twitter)</Label>
                <div className="relative mt-1">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <XIcon />
                  </div>
                  <Input
                    id="xUrl"
                    name="xUrl"
                    value={formData.xUrl}
                    onChange={handleInputChange}
                    placeholder="https://x.com/yourcompany"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* YouTube */}
              <div>
                <Label htmlFor="youtubeUrl">YouTube</Label>
                <div className="relative mt-1">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <YoutubeIcon />
                  </div>
                  <Input
                    id="youtubeUrl"
                    name="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleInputChange}
                    placeholder="https://youtube.com/@yourcompany"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Logo */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Upload className="h-5 w-5 mr-2 text-purple-600" />
              Company Branding
            </h3>
            
            <div>
              <Label htmlFor="logo">Company Logo</Label>
              <div className="mt-2">
                {logoPreview ? (
                  <div className="flex flex-col items-center space-y-4 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <img 
                      src={logoPreview} 
                      alt="Company logo preview" 
                      className="w-32 h-32 object-cover rounded-lg border shadow-sm"
                    />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">Logo uploaded successfully</p>
                      <p className="text-xs text-gray-500">This will appear on your invoices and documents</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={onRemoveLogo}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove Logo
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Upload Company Logo</p>
                      <p className="text-xs text-gray-500">Drag and drop or click to browse</p>
                    </div>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={onLogoUpload}
                      className="mt-4 cursor-pointer"
                    />
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2 space-y-1">
                <p>• Maximum file size: 5MB</p>
                <p>• Recommended: 300x300px, square format (1:1 ratio)</p>
                <p>• Supported formats: JPG, PNG, GIF</p>
                <p>• If no logo is uploaded, we'll use your company initials</p>
              </div>
            </div>
          </div>

          {/* Preview Card */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
            <CompanyCardPreview 
              formData={formData} 
              logoPreview={logoPreview} 
            />
            <p className="text-xs text-gray-600 mt-2 text-center">This is how your company card will appear</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button 
          onClick={onPrev}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={!canProceed}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Next: Review Details
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};