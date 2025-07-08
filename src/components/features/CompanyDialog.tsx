import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Company } from '@/types';
import { CompanyFormData } from '@/services/business/companyValidationService';

interface CompanyDialogProps {
  isDialogOpen: boolean;
  editingCompany: Company | null;
  formData: CompanyFormData;
  logoPreview: string | null;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleStatusChange: (value: string) => void;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeLogo: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleAddNew: () => void;
  closeDialog: () => void;
}

export const CompanyDialog: React.FC<CompanyDialogProps> = ({
  isDialogOpen,
  editingCompany,
  formData,
  logoPreview,
  handleInputChange,
  handleStatusChange,
  handleLogoUpload,
  removeLogo,
  handleSubmit,
  handleAddNew,
  closeDialog
}) => {
  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogTrigger asChild>
        <Button className="bg-black hover:bg-gray-800 w-full max-w-md py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg font-bold text-white" onClick={handleAddNew}>
          <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
          Add Company
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingCompany ? "Edit Company" : "Add New Company"}</DialogTitle>
          <DialogDescription>
            {editingCompany 
              ? "Update the company details below. Required fields are marked with *."
              : "Enter the details for your new company. Required fields are marked with *."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="legalName">Legal Name *</Label>
              <Input
                id="legalName"
                name="legalName"
                value={formData.legalName}
                onChange={handleInputChange}
                placeholder="Enter legal company name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="tradingName">Trading Name *</Label>
              <Input
                id="tradingName"
                name="tradingName"
                value={formData.tradingName}
                onChange={handleInputChange}
                placeholder="Enter trading name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="registrationNo">Registration Number</Label>
              <Input
                id="registrationNo"
                name="registrationNo"
                value={formData.registrationNo}
                onChange={handleInputChange}
                placeholder="Enter registration number"
              />
            </div>
            
            <div>
              <Label htmlFor="vatNumber">VAT Nr.</Label>
              <Input
                id="vatNumber"
                name="vatNumber"
                value={formData.vatNumber}
                onChange={handleInputChange}
                placeholder="Enter VAT number (optional)"
              />
            </div>
            
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                placeholder="Enter industry type"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Passive">Passive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="logo">Company Logo</Label>
              <div className="space-y-2">
                {logoPreview ? (
                  <div className="flex items-center gap-3">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Logo uploaded</p>
                      <div className="mt-1">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={removeLogo}
                          className="w-full"
                        >
                          Remove Logo
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="cursor-pointer"
                    />
                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                      <p>Upload a company logo (max 5MB). If no logo is uploaded, initials will be used.</p>
                      <p className="font-medium text-gray-600">📐 Recommended size: 200x200px (1:1 aspect ratio)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter company email"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            </div>
            
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="Enter website URL"
              />
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter company address"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {editingCompany ? "Update Company" : "Add Company"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};