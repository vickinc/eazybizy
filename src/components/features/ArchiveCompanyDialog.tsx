import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Archive, AlertCircle } from "lucide-react";
import { Company } from '@/types/company.types';

interface ArchiveCompanyDialogProps {
  company: Company | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmArchive: (company: Company) => void;
}

export const ArchiveCompanyDialog: React.FC<ArchiveCompanyDialogProps> = ({
  company,
  isOpen,
  onOpenChange,
  onConfirmArchive,
}) => {
  if (!company) return null;

  const handleArchive = () => {
    onConfirmArchive(company);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Archive className="h-5 w-5 text-orange-600" />
            <span>Archive Company</span>
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to archive this company?
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-orange-900 mb-1">
                {company.tradingName}
              </h4>
              <p className="text-sm text-orange-800">
                This company will be moved to the archive folder. It will no longer appear in your active or passive companies list, but you can restore it later if needed.
              </p>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p className="mb-2"><strong>Current Status:</strong> {company.status}</p>
            <p><strong>Registration:</strong> {company.registrationNo}</p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleArchive}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive Company
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};