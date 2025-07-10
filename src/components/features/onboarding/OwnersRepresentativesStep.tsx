import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';
import { CompanyFormData } from '@/services/business/companyValidationService';
import { Shareholder, Representative, ContactPerson } from '@/types/company.types';
import { ShareholderSection } from './ShareholderSection';
import { RepresentativeSection } from './RepresentativeSection';
import { ContactPersonSection } from './ContactPersonSection';

interface OwnersRepresentativesStepProps {
  formData: CompanyFormData;
  onUpdateFormData: (updates: Partial<CompanyFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
  canProceed: boolean;
  errors: string[];
}

export const OwnersRepresentativesStep: React.FC<OwnersRepresentativesStepProps> = ({
  formData,
  onUpdateFormData,
  onNext,
  onPrev,
  canProceed,
  errors
}) => {
  const handleAddShareholder = (shareholder: Shareholder) => {
    const updatedShareholders = [...formData.shareholders, shareholder];
    onUpdateFormData({
      shareholders: updatedShareholders
    });
  };

  const handleRemoveShareholder = (index: number) => {
    const updatedShareholders = formData.shareholders.filter((_, i) => i !== index);
    onUpdateFormData({ shareholders: updatedShareholders });
  };

  const handleEditShareholder = (index: number, shareholder: Shareholder) => {
    const updatedShareholders = [...formData.shareholders];
    updatedShareholders[index] = shareholder;
    onUpdateFormData({ shareholders: updatedShareholders });
  };

  const handleAddRepresentative = (representative: Representative) => {
    const updatedRepresentatives = [...formData.representatives, representative];
    onUpdateFormData({
      representatives: updatedRepresentatives
    });
  };

  const handleRemoveRepresentative = (index: number) => {
    const updatedRepresentatives = formData.representatives.filter((_, i) => i !== index);
    onUpdateFormData({ representatives: updatedRepresentatives });
  };

  const handleEditRepresentative = (index: number, representative: Representative) => {
    const updatedRepresentatives = [...formData.representatives];
    updatedRepresentatives[index] = representative;
    onUpdateFormData({ representatives: updatedRepresentatives });
  };

  const handleSelectContactPerson = (person: ContactPerson) => {
    onUpdateFormData({ mainContactPerson: person });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Owners & Representatives</h2>
        <p className="text-gray-600">Add company ownership and representative information</p>
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

      <div className="space-y-8">
        <RepresentativeSection
          representatives={formData.representatives}
          onAdd={handleAddRepresentative}
          onRemove={handleRemoveRepresentative}
          onEdit={handleEditRepresentative}
        />

        <ShareholderSection
          shareholders={formData.shareholders}
          onAdd={handleAddShareholder}
          onRemove={handleRemoveShareholder}
          onEdit={handleEditShareholder}
        />

        <ContactPersonSection
          shareholders={formData.shareholders}
          representatives={formData.representatives}
          mainContactPerson={formData.mainContactPerson}
          onSelectContact={handleSelectContactPerson}
        />
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