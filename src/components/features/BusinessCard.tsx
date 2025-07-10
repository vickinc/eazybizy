import React from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Mail, Globe, Phone, Share2, Download, Trash2 } from "lucide-react";
import { FormattedBusinessCard } from "@/types/businessCards.types";
import { isImageLogo } from "@/utils/logoUtils";

interface TemplateStyles {
  background?: string;
  color?: string;
  border?: string;
  textColor: string;
}

interface TooltipWrapperProps {
  children: React.ReactNode;
  text: string;
  buttonId: string;
  className?: string;
  setHoveredButton: (buttonId: string | null) => void;
}

const TooltipWrapper: React.FC<TooltipWrapperProps> = ({ 
  children, 
  text, 
  buttonId, 
  className = "",
  setHoveredButton 
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={className}
          onMouseEnter={() => setHoveredButton(buttonId)}
          onMouseLeave={() => setHoveredButton(null)}
        >
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface BusinessCardProps {
  card: FormattedBusinessCard;
  showActions?: boolean;
  handleShareCard: (card: FormattedBusinessCard) => void;
  handleDownloadCard: (card: FormattedBusinessCard) => void;
  handleDelete: (cardId: string) => void;
  getTemplateStyles: (template: "modern" | "classic" | "minimal" | "eazy" | "bizy") => TemplateStyles;
  setHoveredButton: (buttonId: string | null) => void;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({
  card,
  showActions = true,
  handleShareCard,
  handleDownloadCard,
  handleDelete,
  getTemplateStyles,
  setHoveredButton
}) => {
  const templateStyles = getTemplateStyles(card.template);
  
  return (
    <div className="relative">
      <div 
        id={`business-card-${card.id}`}
        className="w-80 h-48 rounded-lg shadow-lg p-6 relative overflow-hidden transform transition-all duration-200 hover:scale-105"
        style={templateStyles}
      >
        {/* Header with Logo and Company */}
        <div className="flex items-start gap-3 mb-4 pr-20 -ml-2 -mt-3">
          {/* Logo */}
          <div className="w-12 h-12 bg-white rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
            {card.company.logo && isImageLogo(card.company.logo) ? (
              <img 
                src={card.company.logo} 
                alt={`${card.company.tradingName} logo`}
                className="w-full h-full rounded object-cover"
              />
            ) : (
              <span className="text-blue-600 font-bold text-sm">
                {card.company.logo || card.company.tradingName.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Company Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold leading-tight truncate" style={{ color: templateStyles.textColor }}>
              {card.company.tradingName}
            </h3>
            <p className="text-xs opacity-75 truncate" style={{ color: templateStyles.textColor }}>
              {card.company.industry}
            </p>
          </div>
        </div>

        {/* Person Info - Middle */}
        {card.personName && (
          <div className="absolute top-16 left-4 right-20" style={{ color: templateStyles.textColor }}>
            <p className="text-lg font-bold truncate">{card.personName}</p>
            {card.position && (
              <p className="text-sm opacity-85 truncate">{card.position}</p>
            )}
          </div>
        )}

        {/* Contact Info - Bottom */}
        <div className="absolute bottom-4 left-4 right-20">
          <div className="space-y-1" style={{ color: templateStyles.textColor }}>
            <div className="flex items-center gap-2 text-xs">
              <Mail className="w-3 h-3 flex-shrink-0 opacity-75" />
              <span className="truncate">{card.personEmail || card.company.email}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Globe className="w-3 h-3 flex-shrink-0 opacity-75" />
              <span className="truncate">{card.company.website}</span>
            </div>
            {(card.personPhone || card.company.phone) && (
              <div className="flex items-center gap-2 text-xs">
                <Phone className="w-3 h-3 flex-shrink-0 opacity-75" />
                <span className="truncate">{card.personPhone || card.company.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* QR Code - Bottom Right */}
        <div className="absolute bottom-4 right-4 w-16 h-16 bg-white rounded flex items-center justify-center">
          <img 
            src={card.qrCodeUrl}
            alt="QR Code"
            className="w-14 h-14"
          />
        </div>

        {/* Action Buttons - Top Right Inside Card */}
        {showActions && (
          <div className="absolute top-2 right-2 flex gap-1">
            <TooltipWrapper 
              text="Share Card" 
              buttonId={`share-${card.id}`}
              setHoveredButton={setHoveredButton}
            >
              <Button 
                size="sm" 
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareCard(card);
                }}
                className="h-8 w-8 p-0 bg-white hover:bg-blue-50 rounded-lg shadow-md border border-gray-200"
              >
                <Share2 className="w-4 h-4 text-gray-700" />
              </Button>
            </TooltipWrapper>

            <TooltipWrapper 
              text="Download PNG" 
              buttonId={`download-${card.id}`}
              setHoveredButton={setHoveredButton}
            >
              <Button 
                size="sm" 
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadCard(card);
                }}
                className="h-8 w-8 p-0 bg-white hover:bg-green-50 rounded-lg shadow-md border border-gray-200"
              >
                <Download className="w-4 h-4 text-gray-700" />
              </Button>
            </TooltipWrapper>

            <TooltipWrapper 
              text="Delete" 
              buttonId={`delete-${card.id}`}
              setHoveredButton={setHoveredButton}
            >
              <Button 
                size="sm" 
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(card.id);
                }}
                className="h-8 w-8 p-0 bg-white hover:bg-red-50 rounded-lg shadow-md border border-gray-200"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </TooltipWrapper>
          </div>
        )}
      </div>
    </div>
  );
};