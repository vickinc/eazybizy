import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormattedClient, ClientFormData } from "@/types/client.types";

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            {editingClient ? 'Update client information' : 'Add a new client to your database'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="client-type">Client Type *</Label>
              <Select 
                value={clientForm.clientType} 
                onValueChange={(value: 'INDIVIDUAL' | 'LEGAL_ENTITY') => onClientFormChange('clientType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  <SelectItem value="LEGAL_ENTITY">Legal Entity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="client-name">
                {clientForm.clientType === 'LEGAL_ENTITY' ? 'Legal Name *' : 'Client Name *'}
              </Label>
              <Input 
                id="client-name" 
                placeholder={clientForm.clientType === 'LEGAL_ENTITY' ? 'Enter legal name' : 'Enter client name'}
                value={clientForm.name}
                onChange={(e) => onClientFormChange('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={clientForm.clientType === 'LEGAL_ENTITY' ? 'client-registration' : 'client-passport'}>
                {clientForm.clientType === 'LEGAL_ENTITY' ? 'Registration Nr: *' : 'Passport Nr. / (Date of Birth)'}
              </Label>
              {clientForm.clientType === 'LEGAL_ENTITY' ? (
                <Input 
                  id="client-registration" 
                  placeholder="Enter registration number"
                  value={clientForm.registrationNumber}
                  onChange={(e) => onClientFormChange('registrationNumber', e.target.value)}
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    id="client-passport" 
                    placeholder="Passport number"
                    value={clientForm.passportNumber}
                    onChange={(e) => onClientFormChange('passportNumber', e.target.value)}
                  />
                  <Input 
                    id="client-dob" 
                    type="date"
                    placeholder="Date of birth"
                    value={clientForm.dateOfBirth}
                    onChange={(e) => onClientFormChange('dateOfBirth', e.target.value)}
                  />
                </div>
              )}
            </div>
            {clientForm.clientType === 'LEGAL_ENTITY' && (
              <div>
                <Label htmlFor="client-vat">VAT Nr.</Label>
                <Input 
                  id="client-vat" 
                  placeholder="Enter VAT number (optional)"
                  value={clientForm.vatNumber}
                  onChange={(e) => onClientFormChange('vatNumber', e.target.value)}
                />
              </div>
            )}
            {clientForm.clientType === 'LEGAL_ENTITY' && (
              <>
                <div>
                  <Label htmlFor="client-contact-person">Contact Person Name *</Label>
                  <Input 
                    id="client-contact-person" 
                    placeholder="Enter contact person name"
                    value={clientForm.contactPersonName}
                    onChange={(e) => onClientFormChange('contactPersonName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="client-contact-position">Contact Person Position</Label>
                  <Input 
                    id="client-contact-position" 
                    placeholder="Enter position (optional)"
                    value={clientForm.contactPersonPosition}
                    onChange={(e) => onClientFormChange('contactPersonPosition', e.target.value)}
                  />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="client-email">Email *</Label>
              <Input 
                id="client-email" 
                type="email"
                placeholder="Enter email address"
                value={clientForm.email}
                onChange={(e) => onClientFormChange('email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="client-phone">Phone</Label>
              <Input 
                id="client-phone" 
                type="tel"
                placeholder="Enter phone number"
                value={clientForm.phone}
                onChange={(e) => onClientFormChange('phone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="client-website">Website</Label>
              <Input 
                id="client-website" 
                type="url"
                placeholder="Enter website URL (optional)"
                value={clientForm.website}
                onChange={(e) => onClientFormChange('website', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="client-industry">Industry</Label>
              <Select value={clientForm.industry} onValueChange={(value) => onClientFormChange('industry', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {availableIndustries.map(industry => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="client-status">Status</Label>
              <Select value={clientForm.status} onValueChange={(value: unknown) => onClientFormChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="client-country">Country</Label>
              <Input 
                id="client-country" 
                placeholder="Enter country"
                value={clientForm.country}
                onChange={(e) => onClientFormChange('country', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="client-city">City</Label>
              <Input 
                id="client-city" 
                placeholder="Enter city"
                value={clientForm.city}
                onChange={(e) => onClientFormChange('city', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="client-zip">Zip Code</Label>
              <Input 
                id="client-zip" 
                placeholder="Enter zip code"
                value={clientForm.zipCode}
                onChange={(e) => onClientFormChange('zipCode', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="client-address">Address</Label>
            <Input 
              id="client-address" 
              placeholder="Enter street address"
              value={clientForm.address}
              onChange={(e) => onClientFormChange('address', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="client-notes">Notes</Label>
            <Textarea 
              id="client-notes" 
              placeholder="Additional notes about the client"
              value={clientForm.notes}
              onChange={(e) => onClientFormChange('notes', e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onResetForm}>
              Cancel
            </Button>
            <Button onClick={editingClient ? onUpdateClient : onCreateClient}>
              {editingClient ? 'Update Client' : 'Add Client'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};