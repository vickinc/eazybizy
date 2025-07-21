import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormattedClient, ClientFormData } from "@/types/client.types";
import Users from "lucide-react/dist/esm/icons/users";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import User from "lucide-react/dist/esm/icons/user";
import Mail from "lucide-react/dist/esm/icons/mail";
import Phone from "lucide-react/dist/esm/icons/phone";
import Globe from "lucide-react/dist/esm/icons/globe";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Badge from "lucide-react/dist/esm/icons/badge";
import Hash from "lucide-react/dist/esm/icons/hash";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";

interface AddEditClientDialogProps {
  isOpen: boolean;
  editingClient: FormattedClient | null;
  clientForm: ClientFormData;
  availableIndustries: string[];
  availableStatuses: Array<{ value: string; label: string }>;
  onOpenChange: (open: boolean) => void;
  onClientFormChange: (field: keyof ClientFormData, value: unknown) => void;
  onCreateClient: () => void;
  onUpdateClient: () => void;
  onResetForm: () => void;
}

export const AddEditClientDialog: React.FC<AddEditClientDialogProps> = ({
  isOpen,
  editingClient,
  clientForm,
  availableIndustries,
  availableStatuses,
  onOpenChange,
  onClientFormChange,
  onCreateClient,
  onUpdateClient,
  onResetForm,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Enhanced Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingClient 
                  ? 'Update client information and contact details' 
                  : 'Add a new client to expand your customer database'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Client Type Section */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
              Client Type
            </h3>
            <div>
              <Label htmlFor="client-type" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Badge className="h-4 w-4" />
                Client Type *
              </Label>
              <Select 
                value={clientForm.clientType} 
                onValueChange={(value: 'INDIVIDUAL' | 'LEGAL_ENTITY') => onClientFormChange('clientType', value)}
              >
                <SelectTrigger id="client-type" className="mt-1">
                  <SelectValue placeholder="Select client type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Individual
                    </div>
                  </SelectItem>
                  <SelectItem value="LEGAL_ENTITY">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Legal Entity
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="bg-green-50 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client-name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  {clientForm.clientType === 'LEGAL_ENTITY' ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  {clientForm.clientType === 'LEGAL_ENTITY' ? 'Legal Name *' : 'Client Name *'}
                </Label>
                <Input 
                  id="client-name" 
                  className="mt-1"
                  placeholder={clientForm.clientType === 'LEGAL_ENTITY' ? 'Enter legal company name' : 'Enter full client name'}
                  value={clientForm.name}
                  onChange={(e) => onClientFormChange('name', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor={clientForm.clientType === 'LEGAL_ENTITY' ? 'client-registration' : 'client-passport'} 
                       className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  {clientForm.clientType === 'LEGAL_ENTITY' ? <Hash className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                  {clientForm.clientType === 'LEGAL_ENTITY' ? 'Registration Number *' : 'Passport Number'}
                </Label>
                {clientForm.clientType === 'LEGAL_ENTITY' ? (
                  <Input 
                    id="client-registration" 
                    className="mt-1"
                    placeholder="Enter company registration number"
                    value={clientForm.registrationNumber}
                    onChange={(e) => onClientFormChange('registrationNumber', e.target.value)}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input 
                      id="client-passport" 
                      placeholder="Passport number"
                      value={clientForm.passportNumber}
                      onChange={(e) => onClientFormChange('passportNumber', e.target.value)}
                    />
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input 
                        id="client-dob" 
                        type="date"
                        className="pl-10"
                        placeholder="Date of birth"
                        value={clientForm.dateOfBirth}
                        onChange={(e) => onClientFormChange('dateOfBirth', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {clientForm.clientType === 'LEGAL_ENTITY' && (
                <div>
                  <Label htmlFor="client-vat" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Hash className="h-4 w-4" />
                    VAT Number
                  </Label>
                  <Input 
                    id="client-vat" 
                    className="mt-1"
                    placeholder="Enter VAT number (if applicable)"
                    value={clientForm.vatNumber}
                    onChange={(e) => onClientFormChange('vatNumber', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional field for tax purposes</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-purple-50 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
              Contact Information
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {clientForm.clientType === 'LEGAL_ENTITY' && (
                <>
                  <div>
                    <Label htmlFor="client-contact-person" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <User className="h-4 w-4" />
                      Contact Person Name *
                    </Label>
                    <Input 
                      id="client-contact-person" 
                      className="mt-1"
                      placeholder="Enter primary contact name"
                      value={clientForm.contactPersonName}
                      onChange={(e) => onClientFormChange('contactPersonName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-contact-position" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Badge className="h-4 w-4" />
                      Contact Person Position
                    </Label>
                    <Input 
                      id="client-contact-position" 
                      className="mt-1"
                      placeholder="Enter job title or position"
                      value={clientForm.contactPersonPosition}
                      onChange={(e) => onClientFormChange('contactPersonPosition', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional - helps with professional communication</p>
                  </div>
                </>
              )}
              
              <div>
                <Label htmlFor="client-email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4" />
                  Email Address *
                </Label>
                <Input 
                  id="client-email" 
                  type="email"
                  className="mt-1"
                  placeholder="Enter email address"
                  value={clientForm.email}
                  onChange={(e) => onClientFormChange('email', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Primary contact email for invoices and communication</p>
              </div>
              
              <div>
                <Label htmlFor="client-phone" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input 
                  id="client-phone" 
                  type="tel"
                  className="mt-1"
                  placeholder="Enter phone number"
                  value={clientForm.phone}
                  onChange={(e) => onClientFormChange('phone', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Include country code for international numbers</p>
              </div>
              
              <div>
                <Label htmlFor="client-website" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Globe className="h-4 w-4" />
                  Website
                </Label>
                <Input 
                  id="client-website" 
                  type="url"
                  className="mt-1"
                  placeholder="https://example.com"
                  value={clientForm.website}
                  onChange={(e) => onClientFormChange('website', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Client's website or online presence</p>
              </div>
            </div>
          </div>

          {/* Business Details Section */}
          <div className="bg-orange-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
                Business Details
              </h3>
              <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full font-medium">
                Optional
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client-industry" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Building2 className="h-4 w-4" />
                  Industry
                </Label>
                <Select value={clientForm.industry} onValueChange={(value) => onClientFormChange('industry', value)}>
                  <SelectTrigger id="client-industry" className="mt-1">
                    <SelectValue placeholder="Select industry sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIndustries.map(industry => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Helps categorize your clients by industry</p>
              </div>
              
              <div>
                <Label htmlFor="client-status" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Badge className="h-4 w-4" />
                  Client Status
                </Label>
                <Select value={clientForm.status} onValueChange={(value: unknown) => onClientFormChange('status', value)}>
                  <SelectTrigger id="client-status" className="mt-1">
                    <SelectValue placeholder="Select client status" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Current relationship status with this client</p>
              </div>
            </div>
          </div>

          {/* Address Information Section */}
          <div className="bg-teal-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                Address Information
              </h3>
              <span className="text-xs text-teal-600 bg-teal-100 px-2 py-1 rounded-full font-medium">
                Optional
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="client-country" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="h-4 w-4" />
                  Country
                </Label>
                <Input 
                  id="client-country" 
                  className="mt-1"
                  placeholder="Enter country"
                  value={clientForm.country}
                  onChange={(e) => onClientFormChange('country', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="client-city" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="h-4 w-4" />
                  City
                </Label>
                <Input 
                  id="client-city" 
                  className="mt-1"
                  placeholder="Enter city"
                  value={clientForm.city}
                  onChange={(e) => onClientFormChange('city', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="client-zip" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Hash className="h-4 w-4" />
                  Zip Code
                </Label>
                <Input 
                  id="client-zip" 
                  className="mt-1"
                  placeholder="Enter postal code"
                  value={clientForm.zipCode}
                  onChange={(e) => onClientFormChange('zipCode', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="client-address" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MapPin className="h-4 w-4" />
                Street Address
              </Label>
              <Input 
                id="client-address" 
                className="mt-1"
                placeholder="Enter full street address"
                value={clientForm.address}
                onChange={(e) => onClientFormChange('address', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Complete street address including building/unit number</p>
            </div>
          </div>

          {/* Additional Notes Section */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-gray-500 rounded-full"></div>
                Additional Notes
              </h3>
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full font-medium">
                Optional
              </span>
            </div>
            <div>
              <Label htmlFor="client-notes" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText className="h-4 w-4" />
                Internal Notes
              </Label>
              <Textarea 
                id="client-notes" 
                className="mt-1"
                placeholder="Add any additional notes about this client, preferences, special requirements, or important details..."
                rows={3}
                value={clientForm.notes}
                onChange={(e) => onClientFormChange('notes', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Internal notes visible only to your team</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onResetForm} className="px-6">
              Cancel
            </Button>
            <Button onClick={editingClient ? onUpdateClient : onCreateClient} className="px-6">
              {editingClient ? 'Update Client' : 'Add Client'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};