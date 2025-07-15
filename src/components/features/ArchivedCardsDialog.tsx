import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Archive from "lucide-react/dist/esm/icons/archive";
import { BusinessCard } from './BusinessCard';
import { FormattedBusinessCard } from "@/types/businessCards.types";

interface TemplateStyles {
  background?: string;
  color?: string;
  border?: string;
  textColor: string;
}

interface ArchivedCardsDialogProps {
  showArchived: boolean;
  toggleArchiveView: () => void;
  visibleCards: FormattedBusinessCard[];
  handlePreview: (card: FormattedBusinessCard) => void;
  handleDownloadCard: (card: FormattedBusinessCard) => void;
  handleDelete: (cardId: string) => void;
  getTemplateStyles: (template: "modern" | "classic" | "minimal" | "eazy") => TemplateStyles;
  setHoveredButton: (buttonId: string | null) => void;
}

export const ArchivedCardsDialog: React.FC<ArchivedCardsDialogProps> = ({
  showArchived,
  toggleArchiveView,
  visibleCards,
  handlePreview,
  handleDownloadCard,
  handleDelete,
  getTemplateStyles,
  setHoveredButton
}) => {
  const archivedCards = visibleCards.filter(card => card.isArchived);

  return (
    <Dialog open={showArchived} onOpenChange={toggleArchiveView}>
      <DialogContent className="sm:max-w-[800px] max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Archived Business Cards
          </DialogTitle>
          <DialogDescription>
            Manage your archived business cards. Click unarchive to restore them to the main view.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {archivedCards.map((card) => (
            <div key={card.id} className="transform scale-75 origin-top-left">
              <BusinessCard 
                card={card} 
                showActions={true}
                handlePreview={handlePreview}
                handleDownloadCard={handleDownloadCard}
                handleDelete={handleDelete}
                getTemplateStyles={getTemplateStyles}
                setHoveredButton={setHoveredButton}
              />
            </div>
          ))}
        </div>
        {archivedCards.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Archive className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No archived business cards</p>
          </div>
        )}
        <div className="flex justify-end">
          <Button variant="outline" onClick={toggleArchiveView}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};