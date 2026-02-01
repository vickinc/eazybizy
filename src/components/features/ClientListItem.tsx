import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Edit from "lucide-react/dist/esm/icons/edit";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Phone from "lucide-react/dist/esm/icons/phone";
import Mail from "lucide-react/dist/esm/icons/mail";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import Globe from "lucide-react/dist/esm/icons/globe";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import Copy from "lucide-react/dist/esm/icons/copy";
import Archive from "lucide-react/dist/esm/icons/archive";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import { FormattedClient } from "@/types/client.types";

interface ClientListItemProps {
  client: FormattedClient;
  isExpanded: boolean;
  viewMode: 'active' | 'archived';
  onToggleExpansion: (clientId: string) => void;
  onEdit: (client: FormattedClient) => void;
  onArchive: (clientId: string) => void;
  onRestore: (clientId: string) => void;
  onDelete: (clientId: string) => void;
  onDuplicate?: (clientId: string) => void;
}

export const ClientListItem: React.FC<ClientListItemProps> = ({
  client,
  isExpanded,
  viewMode,
  onToggleExpansion,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onDuplicate,
}) => {
  return (
    <div className="border rounded-lg hover:bg-gray-50 transition-all duration-200">
      {/* Always visible header */}
      <div 
        className="p-2 cursor-pointer"
        onClick={() => onToggleExpansion(client.id)}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div className="flex items-center flex-wrap gap-2 flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6 pointer-events-none"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            
            {client.companyInfo && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs md:text-sm">
                <div className={`w-3 h-3 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
                  client.companyInfo.logo && (client.companyInfo.logo.startsWith('data:') || client.companyInfo.logo.includes('http') || client.companyInfo.logo.startsWith('/'))
                    ? '' 
                    : 'bg-blue-600'
                }`}>
                  {client.companyInfo.logo && (client.companyInfo.logo.startsWith('data:') || client.companyInfo.logo.includes('http') || client.companyInfo.logo.startsWith('/')) ? (
                    <img 
                      src={client.companyInfo.logo} 
                      alt={`${client.companyInfo.tradingName} logo`} 
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    client.companyInfo.tradingName.charAt(0).toUpperCase()
                  )}
                </div>
                {client.companyInfo.tradingName}
              </Badge>
            )}
            
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">{client.name}</h3>
            <Badge variant="outline" className="text-xs md:text-sm bg-green-50 text-green-700 border-green-200">
              {client.clientType === 'INDIVIDUAL' ? 'Individual' : 'Legal Entity'}
            </Badge>
            <Badge variant="outline" className="text-xs md:text-sm">{client.industry}</Badge>
          </div>
          
          <div className="flex items-center flex-wrap justify-start md:justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Badge className={`text-xs md:text-sm ${client.statusConfig.color}`}>
              {client.statusConfig.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(client); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {onDuplicate && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(client.id); }}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {viewMode === 'active' && client.status !== 'ARCHIVED' ? (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(client.id); }}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                ) : viewMode === 'archived' && (
                  <>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRestore(client.id); }}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onDelete(client.id); }}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Expandable content */}
      {isExpanded && (
        <div className="px-2 pb-2 border-t bg-gray-50/30">
          <div className="pt-2 space-y-2">
            {/* Contact Person Info for Legal Entity */}
            {client.clientType === 'LEGAL_ENTITY' && (client.contactPersonName || client.contactPersonPosition) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {client.contactPersonName && (
                  <div className="p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="font-medium text-blue-600 text-xs mb-0.5">Contact Person</div>
                    <div className="font-semibold text-sm text-blue-800">{client.contactPersonName}</div>
                  </div>
                )}
                {client.contactPersonPosition && (
                  <div className="p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="font-medium text-blue-600 text-xs mb-0.5">Position</div>
                    <div className="font-semibold text-sm text-blue-800">{client.contactPersonPosition}</div>
                  </div>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Email</div>
                <div className="font-semibold text-sm flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  <a 
                    href={client.emailLink}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {client.email}
                  </a>
                </div>
              </div>
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Phone</div>
                <div className="font-semibold text-sm flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  {client.phoneLink ? (
                    <a 
                      href={client.phoneLink}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {client.phone}
                    </a>
                  ) : (
                    'No phone'
                  )}
                </div>
              </div>
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Location</div>
                <div className="font-semibold text-sm flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {client.formattedAddress}
                </div>
              </div>
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Revenue</div>
                <div className="text-sm">
                  <div className="flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />
                    <span className="font-semibold">{client.formattedTotalInvoiced}</span>
                    <span className="text-gray-500 ml-1">invoiced</span>
                  </div>
                  <div className="text-green-600 font-semibold">{client.formattedTotalPaid} paid</div>
                </div>
              </div>
            </div>
            
            {/* Website Row */}
            {client.websiteUrl && (
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Website</div>
                <div className="text-sm flex items-center">
                  <Globe className="h-3 w-3 mr-1" />
                  <a 
                    href={client.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {client.website}
                  </a>
                </div>
              </div>
            )}

            {client.formattedLastInvoiceDate && (
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Last Invoice</div>
                <div className="text-sm flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {client.formattedLastInvoiceDate}
                </div>
              </div>
            )}

            {client.notes && (
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Notes</div>
                <div className="text-sm text-gray-600">{client.notes}</div>
              </div>
            )}
            
            <div className="flex justify-between text-xs text-gray-500 pt-1 border-t">
              <span>Created: {client.formattedCreatedAt}</span>
              <span>Status: {client.statusConfig.label}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};