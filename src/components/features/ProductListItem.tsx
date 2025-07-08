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
import { Edit, Trash2, ChevronDown, ChevronUp, Truck, MoreHorizontal, Copy, Power, PowerOff } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  cost: number;
  costCurrency: string;
  marginPercentage: number;
  marginColor: string;
  isActive: boolean;
  companyName: string;
  companyTradingName: string;
  companyLogo: string;
  vendorName?: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

interface ProductListItemProps {
  product: Product;
  isExpanded: boolean;
  isHighlighted: boolean;
  onToggleExpansion: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  formatCurrency: (amount: number, currency: string) => string;
  getCompanyName: (companyId: number) => string;
  getVendorName: (vendorId: string | null) => string;
}

export const ProductListItem: React.FC<ProductListItemProps> = ({
  product,
  isExpanded,
  isHighlighted,
  onToggleExpansion,
  onToggleStatus,
  onEdit,
  onDelete,
  onDuplicate,
  formatCurrency,
  getCompanyName,
  getVendorName
}) => {
  return (
    <div 
      id={`product-${product.id}`}
      className={`border rounded-lg transition-all duration-500 ${
        isHighlighted 
          ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
          : 'border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div 
        className="p-2 cursor-pointer"
        onClick={() => onToggleExpansion(product.id)}
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
            
            {product.groupName && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs md:text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: product.groupColor }}
                />
                {product.groupName}
              </Badge>
            )}
            
            <Badge variant="outline" className="flex items-center gap-1 text-xs md:text-sm">
              <div className={`w-3 h-3 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
                product.companyLogo && (product.companyLogo.startsWith('data:') || product.companyLogo.includes('http') || product.companyLogo.startsWith('/'))
                  ? '' 
                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
              }`}>
                {product.companyLogo && (product.companyLogo.startsWith('data:') || product.companyLogo.includes('http') || product.companyLogo.startsWith('/')) ? (
                  <img 
                    src={product.companyLogo} 
                    alt={`${product.companyTradingName} logo`} 
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  product.companyTradingName.charAt(0).toUpperCase()
                )}
              </div>
              {product.companyTradingName}
            </Badge>

            <h3 className="font-semibold text-gray-900 text-sm md:text-base">{product.name}</h3>

            {product.vendorName && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs md:text-sm">
                <Truck className="h-3 w-3" />
                {product.vendorName}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center flex-wrap justify-start md:justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Badge variant="outline" className="text-xs md:text-sm">
              {product.price.toLocaleString('en-US', { style: 'currency', currency: product.currency })}
            </Badge>
            <Badge className={product.isActive ? "bg-green-100 text-green-800 text-xs md:text-sm" : "bg-gray-100 text-gray-800 text-xs md:text-sm"}>
              {product.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(product); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {onDuplicate && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(product.id); }}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStatus(product.id); }}>
                  {product.isActive ? (
                    <PowerOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Power className="h-4 w-4 mr-2" />
                  )}
                  {product.isActive ? 'Deactivate' : 'Activate'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-2 pb-2 border-t bg-gray-50/30">
          <div className="pt-2 space-y-2">
            {product.description && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Description:</span>
                <span className="text-gray-600 ml-2">{product.description}</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Price</div>
                <div className="font-semibold text-green-600 text-sm">{product.currency} {product.price.toFixed(2)}</div>
              </div>
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">COGS</div>
                <div className="font-semibold text-orange-600 text-sm">{product.costCurrency} {product.cost.toFixed(2)}</div>
              </div>
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Margin %</div>
                <div className={`font-semibold text-sm ${product.marginColor}`}>
                  {product.marginPercentage.toFixed(1)}%
                </div>
              </div>
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Company</div>
                <div className="font-semibold text-blue-600 truncate text-sm">{product.companyName}</div>
              </div>
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Vendor</div>
                <div className="font-semibold text-purple-600 truncate text-sm">
                  {product.vendorName || 'N/A'}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 pt-1">
              <span>Created: {product.formattedCreatedAt}</span>
              <span>Updated: {product.formattedUpdatedAt}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};