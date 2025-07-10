import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CountrySelector } from '@/components/ui/CountrySelector';
import { Representative, RepresentativeRole } from '@/types/company.types';

interface RepresentativeFormProps {
  onAdd: (representative: Representative) => void;
  onCancel: () => void;
  initialData?: Representative;
  isEditing?: boolean;
}

const REPRESENTATIVE_ROLES: RepresentativeRole[] = [
  'Chief Executive Officer',
  'Chief Financial Officer',
  'Chief Operating Officer',
  'Board of Directors',
  'President',
  'Managing Director',
  'Public Relations Officer',
  'Company Secretary',
  'Vice President',
  'Other'
];

export const RepresentativeForm: React.FC<RepresentativeFormProps> = ({
  onAdd,
  onCancel,
  initialData,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<Partial<Representative>>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    nationality: initialData?.nationality || '',
    countryOfResidence: initialData?.countryOfResidence || '',
    email: initialData?.email || '',
    phoneNumber: initialData?.phoneNumber || '',
    role: initialData?.role || 'Chief Executive Officer',
    customRole: initialData?.customRole || ''
  });

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.role) {
      return;
    }

    if (formData.role === 'Other' && !formData.customRole?.trim()) {
      return;
    }

    const representative: Representative = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth?.trim() || undefined,
      nationality: formData.nationality || '',
      countryOfResidence: formData.countryOfResidence || '',
      email: formData.email,
      phoneNumber: formData.phoneNumber || '',
      role: formData.role as RepresentativeRole,
      customRole: formData.role === 'Other' ? formData.customRole : undefined
    };

    onAdd(representative);
    
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      nationality: '',
      countryOfResidence: '',
      email: '',
      phoneNumber: '',
      role: 'Chief Executive Officer',
      customRole: ''
    });
  };

  const updateField = (field: keyof Representative, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = !!(
    formData.firstName && 
    formData.lastName && 
    formData.email && 
    formData.role &&
    (formData.role !== 'Other' || formData.customRole?.trim())
  );

  return (
    <div className="border rounded-lg p-6 bg-gray-50">
      <h4 className="font-medium mb-4">Add New Representative</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="repFirstName">First Name *</Label>
          <Input
            id="repFirstName"
            value={formData.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            placeholder="Jane"
            className="mt-1 bg-lime-50 border-lime-200 focus:bg-white"
          />
        </div>
        <div>
          <Label htmlFor="repLastName">Last Name *</Label>
          <Input
            id="repLastName"
            value={formData.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            placeholder="Smith"
            className="mt-1 bg-lime-50 border-lime-200 focus:bg-white"
          />
        </div>
        <div>
          <Label htmlFor="repRole">Role *</Label>
          <Select value={formData.role} onValueChange={(value) => updateField('role', value)}>
            <SelectTrigger className="mt-1 bg-lime-50 border-lime-200 focus:bg-white">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {REPRESENTATIVE_ROLES.map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {formData.role === 'Other' && (
          <div>
            <Label htmlFor="repCustomRole">Custom Role *</Label>
            <Input
              id="repCustomRole"
              value={formData.customRole}
              onChange={(e) => updateField('customRole', e.target.value)}
              placeholder="Enter custom role"
              className="mt-1 bg-lime-50 border-lime-200 focus:bg-white"
            />
          </div>
        )}
        <div>
          <Label htmlFor="repEmail">Email *</Label>
          <Input
            id="repEmail"
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="jane@example.com"
            className="mt-1 bg-lime-50 border-lime-200 focus:bg-white"
          />
        </div>
        <div>
          <Label htmlFor="repPhone">Phone Number</Label>
          <Input
            id="repPhone"
            value={formData.phoneNumber}
            onChange={(e) => updateField('phoneNumber', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="repDob">Date of Birth</Label>
          <Input
            id="repDob"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="repNationality">Nationality</Label>
          <CountrySelector
            value={formData.nationality || ''}
            onChange={(value) => updateField('nationality', value)}
            placeholder="Select nationality..."
            className="mt-1 bg-white hover:bg-gray-50"
          />
        </div>
        <div>
          <Label htmlFor="repResidence">Country of Residence</Label>
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
          {isEditing ? 'Update Representative' : 'Add Representative'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};