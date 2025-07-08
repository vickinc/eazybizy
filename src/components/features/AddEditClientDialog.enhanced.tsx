import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, Building } from "lucide-react";
import { toast } from "sonner";
import { clientsApiService, ClientFormData, Client } from '@/services/api/clientsApiService';

interface Company {
  id: number;
  tradingName: string;
  legalName?: string;
}

interface AddEditClientDialogEnhancedProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingClient?: Client | null;
  companies: Company[];
  onClientCreated?: (client: Client) => void;
  onClientUpdated?: (client: Client) => void;
  initialCompanyId?: number;
}

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Real Estate',
  'Transportation',
  'Hospitality',
  'Media & Entertainment',
  'Non-profit',
  'Government',
  'Other'
];

const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Germany',
  'France',
  'Australia',
  'Japan',
  'Singapore',
  'Netherlands',
  'Sweden',
  'Norway',
  'Denmark',
  'Other'
];

export const AddEditClientDialogEnhanced: React.FC<AddEditClientDialogEnhancedProps> = ({
  isOpen,
  onOpenChange,
  editingClient = null,
  companies,
  onClientCreated,
  onClientUpdated,
  initialCompanyId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>({
    clientType: 'Individual',
    name: '',
    contactPersonName: '',
    contactPersonPosition: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    zipCode: '',
    country: '',
    industry: '',
    status: 'ACTIVE',
    notes: '',
    registrationNumber: '',
    vatNumber: '',
    passportNumber: '',
    dateOfBirth: ''
  });

  // Reset form when dialog opens/closes or editing client changes
  useEffect(() => {
    if (isOpen) {
      if (editingClient) {
        setFormData({
          companyId: editingClient.companyId,
          clientType: editingClient.clientType as 'Individual' | 'Legal Entity',
          name: editingClient.name,
          contactPersonName: editingClient.contactPersonName || '',
          contactPersonPosition: editingClient.contactPersonPosition || '',
          email: editingClient.email,
          phone: editingClient.phone || '',
          website: editingClient.website || '',
          address: editingClient.address || '',
          city: editingClient.city || '',
          zipCode: editingClient.zipCode || '',
          country: editingClient.country || '',
          industry: editingClient.industry || '',
          status: editingClient.status,
          notes: editingClient.notes || '',
          registrationNumber: editingClient.registrationNumber || '',
          vatNumber: editingClient.vatNumber || '',
          passportNumber: editingClient.passportNumber || '',
          dateOfBirth: editingClient.dateOfBirth || ''
        });
      } else {
        setFormData({
          companyId: initialCompanyId,
          clientType: 'Individual',
          name: '',
          contactPersonName: '',
          contactPersonPosition: '',
          email: '',
          phone: '',
          website: '',
          address: '',
          city: '',
          zipCode: '',
          country: '',
          industry: '',
          status: 'ACTIVE',
          notes: '',
          registrationNumber: '',
          vatNumber: '',
          passportNumber: '',
          dateOfBirth: ''
        });
      }
    }
  }, [isOpen, editingClient, initialCompanyId]);

  const handleInputChange = (field: keyof ClientFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateEmail = async (email: string) => {
    if (!email || email === editingClient?.email) return true;
    
    try {
      const validation = await clientsApiService.validateClientEmail(email, editingClient?.id);
      return validation.isValid;
    } catch (error) {
      console.error('Email validation error:', error);
      return true; // Allow submission if validation fails
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter client name');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('Please enter client email');
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Client type specific validation
    if (formData.clientType === 'Legal Entity') {
      if (!formData.registrationNumber && !formData.vatNumber) {
        toast.error('Please enter either registration number or VAT number for legal entities');
        return;
      }
    } else {
      // Individual validation
      if (formData.dateOfBirth) {
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) {
          toast.error('Client must be at least 18 years old');
          return;
        }
      }
    }

    // Validate email uniqueness
    const isEmailValid = await validateEmail(formData.email);
    if (!isEmailValid) {
      toast.error('This email address is already in use');
      return;
    }

    setIsLoading(true);
    
    try {
      if (editingClient) {
        // Update existing client
        const updatedClient = await clientsApiService.updateClient(editingClient.id, formData);
        toast.success('Client updated successfully');
        onClientUpdated?.(updatedClient);
      } else {
        // Create new client
        const newClient = await clientsApiService.createClient(formData);
        toast.success('Client created successfully');
        onClientCreated?.(newClient);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error(editingClient ? 'Failed to update client' : 'Failed to create client');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {formData.clientType === 'Legal Entity' ? <Building className="h-5 w-5" /> : <User className="h-5 w-5" />}
            {editingClient ? 'Edit' : 'Add'} Client
          </DialogTitle>
          <DialogDescription>
            {editingClient ? 'Update the client information' : 'Enter the details for the new client'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-2 cursor-pointer border rounded-lg p-4 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="clientType"
                    value="Individual"
                    checked={formData.clientType === 'Individual'}
                    onChange={(e) => handleInputChange('clientType', e.target.value)}
                    className="text-blue-600"
                  />
                  <User className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Individual</div>
                    <div className="text-sm text-gray-500">Personal client</div>
                  </div>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer border rounded-lg p-4 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="clientType"
                    value="Legal Entity"
                    checked={formData.clientType === 'Legal Entity'}
                    onChange={(e) => handleInputChange('clientType', e.target.value)}
                    className="text-blue-600"
                  />
                  <Building className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Legal Entity</div>
                    <div className="text-sm text-gray-500">Company or organization</div>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Associated Company */}
                {companies.length > 0 && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="companyId">Associated Company</Label>
                    <Select
                      value={formData.companyId?.toString() || ''}
                      onValueChange={(value) => handleInputChange('companyId', value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No company association</SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.tradingName || company.legalName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Client Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {formData.clientType === 'Individual' ? 'Full Name' : 'Company Name'} *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder={formData.clientType === 'Individual' ? 'John Doe' : 'Acme Corporation'}
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="client@example.com"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => handleInputChange('industry', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          {formData.clientType === 'Legal Entity' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Person</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonName">Contact Person Name</Label>
                    <Input
                      id="contactPersonName"
                      value={formData.contactPersonName}
                      onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonPosition">Position</Label>
                    <Input
                      id="contactPersonPosition"
                      value={formData.contactPersonPosition}
                      onChange={(e) => handleInputChange('contactPersonPosition', e.target.value)}
                      placeholder="CEO, Manager, etc."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Address Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="New York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="10001"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleInputChange('country', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {formData.clientType === 'Individual' ? 'Personal Information' : 'Legal Information'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formData.clientType === 'Legal Entity' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Registration Number</Label>
                    <Input
                      id="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                      placeholder="Company registration number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">VAT Number</Label>
                    <Input
                      id="vatNumber"
                      value={formData.vatNumber}
                      onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                      placeholder="VAT registration number"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passportNumber">Passport Number</Label>
                    <Input
                      id="passportNumber"
                      value={formData.passportNumber}
                      onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                      placeholder="Passport number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes or special requirements"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingClient ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingClient ? 'Update Client' : 'Create Client'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditClientDialogEnhanced;