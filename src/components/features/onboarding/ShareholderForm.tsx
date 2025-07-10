import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CountrySelector } from '@/components/ui/CountrySelector';
import { Shareholder } from '@/types/company.types';

interface ShareholderFormProps {
  onAdd: (shareholder: Shareholder) => void;
  onCancel: () => void;
  initialData?: Shareholder;
  isEditing?: boolean;
}

export const ShareholderForm: React.FC<ShareholderFormProps> = ({
  onAdd,
  onCancel,
  initialData,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<Partial<Shareholder>>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    nationality: initialData?.nationality || '',
    countryOfResidence: initialData?.countryOfResidence || '',
    email: initialData?.email || '',
    phoneNumber: initialData?.phoneNumber || '',
    ownershipPercent: initialData?.ownershipPercent || undefined
  });

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      return;
    }

    if (!formData.ownershipPercent || formData.ownershipPercent <= 0) {
      return;
    }

    const shareholder: Shareholder = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth?.trim() || undefined,
      nationality: formData.nationality || '',
      countryOfResidence: formData.countryOfResidence || '',
      email: formData.email,
      phoneNumber: formData.phoneNumber || '',
      ownershipPercent: formData.ownershipPercent || 0
    };

    onAdd(shareholder);
    
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      nationality: '',
      countryOfResidence: '',
      email: '',
      phoneNumber: '',
      ownershipPercent: undefined
    });
  };

  const updateField = (field: keyof Shareholder, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = !!(
    formData.firstName && 
    formData.lastName && 
    formData.email && 
    formData.ownershipPercent && 
    formData.ownershipPercent > 0
  );

  return (
    <div className="border rounded-lg p-6 bg-gray-50">
      <h4 className="font-medium mb-2">Add New Shareholder</h4>
      <p className="text-sm text-gray-600 mb-4">Fill in shareholder details. Name, email, and ownership percentage are required.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="shareholderFirstName">First Name</Label>
          <Input
            id="shareholderFirstName"
            value={formData.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            placeholder="John"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="shareholderLastName">Last Name</Label>
          <Input
            id="shareholderLastName"
            value={formData.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            placeholder="Doe"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="shareholderEmail">Email</Label>
          <Input
            id="shareholderEmail"
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="john@example.com"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="shareholderPhone">Phone Number</Label>
          <Input
            id="shareholderPhone"
            value={formData.phoneNumber}
            onChange={(e) => updateField('phoneNumber', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="shareholderDob">Date of Birth</Label>
          <Input
            id="shareholderDob"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="shareholderOwnership">Ownership (%)</Label>
          <Input
            id="shareholderOwnership"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.ownershipPercent || ''}
            onChange={(e) => updateField('ownershipPercent', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="25.5"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="shareholderNationality">Nationality</Label>
          <CountrySelector
            value={formData.nationality || ''}
            onChange={(value) => updateField('nationality', value)}
            placeholder="Select nationality..."
            className="mt-1 bg-white hover:bg-gray-50"
          />
        </div>
        <div>
          <Label htmlFor="shareholderResidence">Country of Residence</Label>
          <CountrySelector
            value={formData.countryOfResidence || ''}
            onChange={(value) => updateField('countryOfResidence', value)}
            placeholder="Select country..."
            className="mt-1 bg-white hover:bg-gray-50"
          />
        </div>
      </div>
      <div className="flex space-x-2 mt-6">
        <Button onClick={handleSubmit} disabled={!isValid}>
          {isEditing ? 'Update Shareholder' : 'Add Shareholder'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};