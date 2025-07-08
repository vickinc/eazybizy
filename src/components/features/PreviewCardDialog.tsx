import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Wallet } from "lucide-react";
import { BusinessCard } from './BusinessCard';
import { FormattedBusinessCard } from "@/types/businessCards.types";

interface TemplateStyles {
  background?: string;
  color?: string;
  border?: string;
  textColor: string;
}

interface PreviewCardDialogProps {
  isPreviewOpen: boolean;
  closePreview: () => void;
  previewCard: FormattedBusinessCard | null;
  handleDownloadCard: (card: FormattedBusinessCard) => void;
  handleAddToWallet?: (card: FormattedBusinessCard) => void;
  getTemplateStyles: (template: "modern" | "classic" | "minimal" | "eazy") => TemplateStyles;
  setHoveredButton: (buttonId: string | null) => void;
}

export const PreviewCardDialog: React.FC<PreviewCardDialogProps> = ({
  isPreviewOpen,
  closePreview,
  previewCard,
  handleDownloadCard,
  handleAddToWallet,
  getTemplateStyles,
  setHoveredButton
}) => {
  const handlePreview = () => {}; // Empty function since preview is already open
  const handleDelete = () => {}; // Empty function since delete shouldn't be available in preview

  return (
    <Dialog open={isPreviewOpen} onOpenChange={closePreview}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Business Card Preview</DialogTitle>
          <DialogDescription>Preview and download your business card</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          {previewCard && (
            <div className="transform scale-75 origin-center">
              <BusinessCard 
                card={previewCard} 
                showActions={false}
                handlePreview={handlePreview}
                handleDownloadCard={handleDownloadCard}
                handleDelete={handleDelete}
                getTemplateStyles={getTemplateStyles}
                setHoveredButton={setHoveredButton}
              />
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={closePreview}>Close</Button>
          <Button onClick={() => previewCard && handleDownloadCard(previewCard)}>
            <Download className="w-4 h-4 mr-2" />
            Download PNG
          </Button>
          {handleAddToWallet && (
            <Button 
              onClick={() => previewCard && handleAddToWallet(previewCard)} 
              variant="outline"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Add to Wallet
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};