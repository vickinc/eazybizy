import React from 'react';
import { Button } from "@/components/ui/button";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import QrCode from "lucide-react/dist/esm/icons/qr-code";
import { BusinessCard } from './BusinessCard';
import { FormattedBusinessCard } from "@/types/businessCards.types";
import { Company } from '@/types';

interface TemplateStyles {
  background?: string;
  color?: string;
  border?: string;
  textColor: string;
}

interface BusinessCardListProps {
  visibleCards: FormattedBusinessCard[];
  companies: Company[];
  handleShareCard: (card: FormattedBusinessCard) => void;
  handleDownloadCard: (card: FormattedBusinessCard) => void;
  handleDelete: (cardId: string) => void;
  getTemplateStyles: (template: "modern" | "classic" | "minimal" | "eazy" | "bizy") => TemplateStyles;
  setHoveredButton: (buttonId: string | null) => void;
}

export const BusinessCardList: React.FC<BusinessCardListProps> = React.memo(({
  visibleCards,
  companies,
  handleShareCard,
  handleDownloadCard,
  handleDelete,
  getTemplateStyles,
  setHoveredButton
}) => {
  return (
    <>
      {/* Business Cards Grid */}
      {visibleCards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 place-items-start">
          {visibleCards.map((card) => (
            <BusinessCard 
              key={card.id} 
              card={card}
              handleShareCard={handleShareCard}
              handleDownloadCard={handleDownloadCard}
              handleDelete={handleDelete}
              getTemplateStyles={getTemplateStyles}
              setHoveredButton={setHoveredButton}
            />
          ))}
        </div>
      ) : companies.length > 0 ? (
        <div className="text-center py-16">
          <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Business Cards Yet</h3>
          <p className="text-gray-600 mb-6">Create professional business cards for your companies with QR codes and custom details.</p>
        </div>
      ) : (
        <div className="text-center py-16">
          <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Companies</h3>
          <p className="text-gray-600 mb-6">You need to add active companies first before creating business cards.</p>
          <Button variant="outline">Go to Companies</Button>
        </div>
      )}
    </>
  );
});