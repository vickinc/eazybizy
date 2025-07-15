import React from 'react';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BusinessCardFormData, PersonOption } from '@/types/businessCards.types';
import { Company } from '@/types';
import Mail from "lucide-react/dist/esm/icons/mail";
import Globe from "lucide-react/dist/esm/icons/globe";
import Phone from "lucide-react/dist/esm/icons/phone";
import { isImageLogo } from "@/utils/logoUtils";

interface CreateCardDialogProps {
  formData: BusinessCardFormData;
  personOptions: PersonOption[];
  selectedCompany: Company | null;
  handleSelectChange: (field: string, value: string) => void;
  handleCreateCard: () => void;
  closeDialog: () => void;
}

export const CreateCardDialog: React.FC<CreateCardDialogProps> = ({
  formData,
  personOptions,
  selectedCompany,
  handleSelectChange,
  handleCreateCard,
  closeDialog
}) => {
  // Get selected person details for preview
  const selectedPerson = personOptions.find(p => p.id === formData.personId);

  // Auto-adjust QR type if company has no website and current type is website
  React.useEffect(() => {
    if (formData.qrType === "website" && selectedCompany && !selectedCompany.website) {
      handleSelectChange("qrType", "email");
    }
  }, [formData.qrType, selectedCompany, handleSelectChange]);

  // Get template styles for preview
  const getTemplateStyles = (template: "modern" | "classic" | "minimal" | "eazy" | "bizy") => {
    const styles = {
      modern: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        textColor: 'white'
      },
      classic: {
        background: '#f8f9fa',
        color: '#212529',
        border: '2px solid #dee2e6',
        textColor: 'black'
      },
      minimal: {
        background: 'white',
        color: '#333',
        border: '1px solid #e0e0e0',
        textColor: 'black'
      },
      eazy: {
        background: '#d9f99d',
        color: '#365314',
        border: '1px solid #a3e635',
        textColor: '#365314'
      },
      bizy: {
        background: 'linear-gradient(316deg, #ffcc66 0%, #ff9933 74%)',
        backgroundColor: '#ffcc66',
        textColor: 'black'
      }
    };
    
    return styles[template] || styles.modern;
  };

  const templateStyles = getTemplateStyles(formData.template);
  return (
    <DialogContent className="sm:max-w-[580px]">
      <DialogHeader className="pb-4">
        <DialogTitle className="text-xl font-semibold text-gray-900">Create Business Card</DialogTitle>
        <DialogDescription className="text-gray-600 mt-1">
          Create a professional business card with QR code and custom design.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={(e) => { e.preventDefault(); handleCreateCard(); }} className="space-y-4">
        {/* Company Display */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
          <Label className="text-sm font-medium text-blue-900 mb-2 block">Company</Label>
          <div className="flex items-center gap-3">
            {selectedCompany?.logo && isImageLogo(selectedCompany.logo) ? (
              <img 
                src={selectedCompany.logo} 
                alt={`${selectedCompany.tradingName} logo`}
                className="w-8 h-8 rounded object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {selectedCompany?.logo || selectedCompany?.tradingName?.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium text-blue-900 text-sm">{selectedCompany?.tradingName || 'No company selected'}</p>
              {selectedCompany?.industry && (
                <p className="text-xs text-blue-700">{selectedCompany.industry}</p>
              )}
            </div>
          </div>
        </div>

        {/* Person Selection */}
        <div className="space-y-2">
          <Label htmlFor="personId" className="text-sm font-medium text-gray-700">
            Select Person <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={formData.personId} 
            onValueChange={(value) => handleSelectChange("personId", value)}
          >
            <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
              <SelectValue placeholder="Choose a person to create the card for" />
            </SelectTrigger>
            <SelectContent>
              {personOptions.map((person) => (
                <SelectItem key={person.id} value={person.id} className="py-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{person.firstName} {person.lastName}</span>
                    <span className="text-sm text-gray-500">{person.role}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* QR Code and Template Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="qrType" className="text-sm font-medium text-gray-700">QR Code Type</Label>
            <Select 
              value={formData.qrType} 
              onValueChange={(value) => handleSelectChange("qrType", value)}
            >
              <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectedCompany?.website && (
                  <SelectItem value="website" className="py-2">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>Website</span>
                    </div>
                  </SelectItem>
                )}
                <SelectItem value="email" className="py-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template" className="text-sm font-medium text-gray-700">Design Template</Label>
            <Select 
              value={formData.template} 
              onValueChange={(value) => handleSelectChange("template", value)}
            >
              <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eazy" className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-lime-300 rounded"></div>
                    <span>Eazy</span>
                  </div>
                </SelectItem>
                <SelectItem value="bizy" className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded"></div>
                    <span>Bizy</span>
                  </div>
                </SelectItem>
                <SelectItem value="modern" className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
                    <span>Modern</span>
                  </div>
                </SelectItem>
                <SelectItem value="classic" className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-200 border border-gray-400 rounded"></div>
                    <span>Classic</span>
                  </div>
                </SelectItem>
                <SelectItem value="minimal" className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
                    <span>Minimal</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Visual Business Card Preview */}
        {selectedPerson && selectedCompany && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h4 className="font-medium text-gray-900 text-sm">Live Preview</h4>
              </div>
              <p className="text-xs text-gray-500">
                {formData.template} • {formData.qrType}
              </p>
            </div>
            <div 
              className="w-72 h-40 rounded-lg shadow-lg p-4 relative overflow-hidden mx-auto transition-all duration-300 hover:shadow-xl"
              style={templateStyles}
            >
              {/* Header with Logo and Company */}
              <div className="flex items-start gap-2 mb-3 pr-16 -ml-1 -mt-1">
                {/* Logo */}
                <div className="w-8 h-8 bg-white rounded flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                  {selectedCompany.logo && isImageLogo(selectedCompany.logo) ? (
                    <img 
                      src={selectedCompany.logo} 
                      alt={`${selectedCompany.tradingName} logo`}
                      className="w-full h-full rounded object-cover"
                    />
                  ) : (
                    <span className="text-blue-600 font-bold text-xs">
                      {selectedCompany.logo || selectedCompany.tradingName.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                
                {/* Company Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold leading-tight truncate" style={{ color: templateStyles.textColor }}>
                    {selectedCompany.tradingName}
                  </h3>
                  <p className="text-xs opacity-75 truncate" style={{ color: templateStyles.textColor }}>
                    {selectedCompany.industry}
                  </p>
                </div>
              </div>

              {/* Person Info - Middle */}
              <div className="absolute top-12 left-3 right-16" style={{ color: templateStyles.textColor }}>
                <p className="text-base font-bold truncate">{selectedPerson.firstName} {selectedPerson.lastName}</p>
                <p className="text-xs opacity-85 truncate">{selectedPerson.role}</p>
              </div>

              {/* Contact Info - Bottom */}
              <div className="absolute bottom-3 left-3 right-16">
                <div className="space-y-0.5" style={{ color: templateStyles.textColor }}>
                  <div className="flex items-center gap-1 text-xs">
                    <Mail className="w-2.5 h-2.5 flex-shrink-0 opacity-75" />
                    <span className="truncate">{selectedPerson.email}</span>
                  </div>
                  {selectedCompany.website && (
                    <div className="flex items-center gap-1 text-xs">
                      <Globe className="w-2.5 h-2.5 flex-shrink-0 opacity-75" />
                      <span className="truncate">{selectedCompany.website}</span>
                    </div>
                  )}
                  {selectedPerson.phoneNumber && (
                    <div className="flex items-center gap-1 text-xs">
                      <Phone className="w-2.5 h-2.5 flex-shrink-0 opacity-75" />
                      <span className="truncate">{selectedPerson.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code - Bottom Right */}
              <div className="absolute bottom-3 right-3 w-12 h-12 bg-white rounded flex items-center justify-center shadow-sm">
                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs text-gray-500 font-mono">QR</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {!formData.personId && (
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                Please select a person to continue
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={closeDialog}
              className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.personId}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-all duration-200 hover:shadow-lg disabled:hover:shadow-none"
            >
              {!formData.personId ? 'Select Person First' : 'Create Card'}
            </Button>
          </div>
        </div>
      </form>
    </DialogContent>
  );
};