"use client";

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
import { FormattedVendor } from "@/types/vendor.types";
import { 
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Phone,
  Globe,
  DollarSign,
  MapPin,
  FileText,
  Package,
  ExternalLink,
  CreditCard,
  Calendar,
  Building2,
  MoreHorizontal,
  Copy,
  Archive,
  RotateCcw
} from "lucide-react";

interface VendorListItemProps {
  vendor: FormattedVendor;
  isExpanded: boolean;
  viewMode: 'active' | 'archived';
  onToggleExpansion: (vendorId: string) => void;
  onEdit: (vendor: FormattedVendor) => void;
  onToggleStatus: (vendorId: string) => void;
  onDelete: (vendorId: string) => void;
  onDuplicate?: (vendorId: string) => void;
}

export const VendorListItem: React.FC<VendorListItemProps> = ({
  vendor,
  isExpanded,
  viewMode,
  onToggleExpansion,
  onEdit,
  onToggleStatus,
  onDelete,
  onDuplicate
}) => {
  return (
    <div className="border rounded-lg hover:bg-gray-50 transition-all duration-200">
      {/* Always visible header */}
      <div 
        className="p-2 cursor-pointer"
        onClick={() => onToggleExpansion(vendor.id)}
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
            
            {vendor.relatedCompanies.map(relatedCompany => (
              <Badge key={relatedCompany.id} variant="outline" className="flex items-center gap-1 text-sm">
                <div className={`w-3 h-3 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
                  relatedCompany.logo && (relatedCompany.logo.startsWith('data:') || relatedCompany.logo.includes('http') || relatedCompany.logo.startsWith('/'))
                    ? '' 
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}>
                  {relatedCompany.logo && (relatedCompany.logo.startsWith('data:') || relatedCompany.logo.includes('http') || relatedCompany.logo.startsWith('/')) ? (
                    <img 
                      src={relatedCompany.logo} 
                      alt={`${relatedCompany.tradingName} logo`} 
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    relatedCompany.tradingName.charAt(0).toUpperCase()
                  )}
                </div>
                {relatedCompany.tradingName}
              </Badge>
            ))}
            
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-base">{vendor.companyName}</h3>
              <p className="text-xs text-gray-500">{vendor.itemsServicesSold}</p>
            </div>
          </div>
          
          <div className="flex items-center flex-wrap justify-start md:justify-end gap-x-4 gap-y-1 text-xs sm:text-sm">
            <Badge variant="outline">{vendor.currency}</Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              {vendor.paymentMethod}
            </Badge>
            <Badge variant="outline" className="hidden sm:flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {vendor.paymentTerms} days
            </Badge>
            <Badge className={vendor.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {vendor.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(vendor); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {onDuplicate && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(vendor.id); }}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {viewMode === 'active' ? (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStatus(vendor.id); }}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStatus(vendor.id); }}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onDelete(vendor.id); }}
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
            {/* Related Companies Section */}
            {vendor.hasMultipleCompanies && (
              <div className="p-2 bg-white rounded border">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-600 text-xs">
                    Related Companies ({vendor.relatedCompanies.length})
                  </div>
                  <Building2 className="h-3 w-3 text-gray-500" />
                </div>
                <div className="flex flex-wrap gap-1">
                  {vendor.relatedCompanies.map(company => (
                    <Badge key={company.id} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          {company.tradingName.charAt(0)}
                        </div>
                        {company.tradingName}
                      </div>
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  This vendor provides services to multiple companies
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Contact Person</div>
                <div className="font-semibold text-sm flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  {vendor.contactPerson}
                </div>
              </div>
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Email</div>
                <div className="font-semibold text-sm flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  <a 
                    href={vendor.mailtoLink}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {vendor.contactEmail}
                  </a>
                </div>
              </div>
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Phone</div>
                <div className="font-semibold text-sm flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  {vendor.phone ? (
                    <a 
                      href={vendor.phoneLink}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {vendor.phone}
                    </a>
                  ) : (
                    <span className="text-gray-500">Not provided</span>
                  )}
                </div>
              </div>
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Website</div>
                <div className="font-semibold text-sm flex items-center">
                  <Globe className="h-3 w-3 mr-1" />
                  {vendor.website ? (
                    <a 
                      href={vendor.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      {vendor.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Payment Method</div>
                <div className="font-semibold text-sm flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {vendor.paymentMethod}
                </div>
              </div>
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Country</div>
                <div className="font-semibold text-sm flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {vendor.vendorCountry || 'Not provided'}
                </div>
              </div>
            </div>

            {(vendor.companyRegistrationNr || vendor.vatNr) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {vendor.companyRegistrationNr && (
                  <div className="p-2 bg-white rounded border">
                    <div className="font-medium text-gray-600 text-xs mb-0.5">Registration Nr.</div>
                    <div className="text-sm flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      {vendor.companyRegistrationNr}
                    </div>
                  </div>
                )}
                {vendor.vatNr && (
                  <div className="p-2 bg-white rounded border">
                    <div className="font-medium text-gray-600 text-xs mb-0.5">VAT Number</div>
                    <div className="text-sm flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      {vendor.vatNr}
                    </div>
                  </div>
                )}
              </div>
            )}

            {vendor.itemsServicesSold && (
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Items/Services Sold</div>
                <div className="text-sm text-gray-600">{vendor.itemsServicesSold}</div>
              </div>
            )}

            {vendor.billingAddress && (
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Billing Address</div>
                <div className="text-sm text-gray-600">{vendor.billingAddress}</div>
              </div>
            )}

            {vendor.notes && (
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Notes</div>
                <div className="text-sm text-gray-600">{vendor.notes}</div>
              </div>
            )}

            {/* Products Section */}
            <div className="p-2 bg-white rounded border">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-600 text-xs">Products ({vendor.uniqueProductCount})</div>
                {vendor.productCount > 0 && (
                  <Package className="h-3 w-3 text-gray-500" />
                )}
              </div>
              {vendor.productCount === 0 ? (
                <div className="text-xs text-gray-500 italic">No products assigned to this vendor</div>
              ) : (
                <div className="space-y-1">
                  {vendor.vendorProducts.map(product => (
                    <div key={product.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <Package className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        <span className="font-medium text-gray-700 truncate">{product.name}</span>
                        {product.description && (
                          <span className="text-gray-500 truncate">- {product.description}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {product.companyName}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {product.formattedPrice}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 pt-1 border-t">
              <span>Created: {vendor.formattedCreatedAt}</span>
              <span>Status: {vendor.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};