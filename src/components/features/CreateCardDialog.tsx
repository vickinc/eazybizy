import React from 'react';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BusinessCardFormData, PersonOption } from '@/types/businessCards.types';
import { Company } from '@/types';
import { Mail, Globe, Phone } from "lucide-react";
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
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Create Business Card</DialogTitle>
        <DialogDescription>
          Create a professional business card with QR code and custom design.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); handleCreateCard(); }} className="space-y-4">
        {/* Company Display (read-only) */}
        <div>
          <Label>Company</Label>
          <div className="px-3 py-2 border rounded-md bg-gray-50 text-gray-700">
            {selectedCompany?.tradingName || 'No company selected'}
          </div>
        </div>

        {/* Person Selection */}
        <div>
          <Label htmlFor="personId">Select Person <span className="text-red-500">*</span></Label>
          <Select 
            value={formData.personId} 
            onValueChange={(value) => handleSelectChange("personId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a person" />
            </SelectTrigger>
            <SelectContent>
              {personOptions.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.firstName} {person.lastName} - {person.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="qrType">QR Code Type</Label>
            <Select 
              value={formData.qrType} 
              onValueChange={(value) => handleSelectChange("qrType", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="template">Design Template</Label>
            <Select 
              value={formData.template} 
              onValueChange={(value) => handleSelectChange("template", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eazy">Eazy</SelectItem>
                <SelectItem value="bizy">Bizy</SelectItem>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Visual Business Card Preview */}
        {selectedPerson && selectedCompany && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Card Preview:</h4>
            <div 
              className="w-80 h-48 rounded-lg shadow-lg p-6 relative overflow-hidden mx-auto"
              style={templateStyles}
            >
              {/* Header with Logo and Company */}
              <div className="flex items-start gap-3 mb-4 pr-20 -ml-2 -mt-3">
                {/* Logo */}
                <div className="w-12 h-12 bg-white rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {selectedCompany.logo && isImageLogo(selectedCompany.logo) ? (
                    <img 
                      src={selectedCompany.logo} 
                      alt={`${selectedCompany.tradingName} logo`}
                      className="w-full h-full rounded object-cover"
                    />
                  ) : (
                    <span className="text-blue-600 font-bold text-sm">
                      {selectedCompany.logo || selectedCompany.tradingName.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                
                {/* Company Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold leading-tight truncate" style={{ color: templateStyles.textColor }}>
                    {selectedCompany.tradingName}
                  </h3>
                  <p className="text-xs opacity-75 truncate" style={{ color: templateStyles.textColor }}>
                    {selectedCompany.industry}
                  </p>
                </div>
              </div>

              {/* Person Info - Middle */}
              <div className="absolute top-16 left-4 right-20" style={{ color: templateStyles.textColor }}>
                <p className="text-lg font-bold truncate">{selectedPerson.firstName} {selectedPerson.lastName}</p>
                <p className="text-sm opacity-85 truncate">{selectedPerson.role}</p>
              </div>

              {/* Contact Info - Bottom */}
              <div className="absolute bottom-4 left-4 right-20">
                <div className="space-y-1" style={{ color: templateStyles.textColor }}>
                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="w-3 h-3 flex-shrink-0 opacity-75" />
                    <span className="truncate">{selectedPerson.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Globe className="w-3 h-3 flex-shrink-0 opacity-75" />
                    <span className="truncate">{selectedCompany.website}</span>
                  </div>
                  {selectedPerson.phoneNumber && (
                    <div className="flex items-center gap-2 text-xs">
                      <Phone className="w-3 h-3 flex-shrink-0 opacity-75" />
                      <span className="truncate">{selectedPerson.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code - Bottom Right */}
              <div className="absolute bottom-4 right-4 w-16 h-16 bg-white rounded flex items-center justify-center">
                <div className="w-14 h-14 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs text-gray-500 font-mono">QR</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!formData.personId}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            Create Card
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};