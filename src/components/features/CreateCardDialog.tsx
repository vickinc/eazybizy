import React from 'react';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Company } from '@/types';

interface BusinessCardFormData {
  companyId: number;
  personName: string;
  position: string;
  qrType: 'website' | 'email';
  template: 'modern' | 'classic' | 'minimal' | 'eazy';
}

interface CreateCardDialogProps {
  formData: BusinessCardFormData;
  companies: Company[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (field: string, value: string) => void;
  handleCreateCard: () => void;
  closeDialog: () => void;
}

export const CreateCardDialog: React.FC<CreateCardDialogProps> = ({
  formData,
  companies,
  handleInputChange,
  handleSelectChange,
  handleCreateCard,
  closeDialog
}) => {
  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Create Business Card</DialogTitle>
        <DialogDescription>
          Create a professional business card with QR code and custom design.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); handleCreateCard(); }} className="space-y-4">
        <div>
          <Label htmlFor="companyId">Company <span className="text-red-500">*</span></Label>
          <Select 
            value={formData.companyId.toString()} 
            onValueChange={(value) => handleSelectChange("companyId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Select a company</SelectItem>
              {companies.filter(c => c.status === "Active").map((company) => (
                <SelectItem key={company.id} value={company.id.toString()}>
                  {company.tradingName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="personName">Person Name</Label>
            <Input
              id="personName"
              name="personName"
              value={formData.personName}
              onChange={handleInputChange}
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label htmlFor="position">Position/Title</Label>
            <Input
              id="position"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              placeholder="Sales Manager"
            />
          </div>
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
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="eazy">Eazy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            Create Card
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};