import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import Package from "lucide-react/dist/esm/icons/package";
import Truck from "lucide-react/dist/esm/icons/truck";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Edit3 from "lucide-react/dist/esm/icons/edit-3";
import { Badge } from "@/components/ui/badge";

interface Company {
  id: number;
  tradingName: string;
  legalName: string;
}


interface Vendor {
  id: string;
  companyName: string;
}

interface EditingProduct {
  id: string;
  companyId: number;
  name: string;
  price: number;
  currency: string;
  vendorId: string | null;
  cost: number;
  costCurrency: string;
  description: string;
}

interface EditProductDialogProps {
  editingProduct: EditingProduct | null;
  onClose: () => void;
  activeCompanies: Company[];
  availableCurrencies: string[];
  availableVendors: Vendor[];
  onEditProductFormChange: (field: keyof EditingProduct, value: unknown) => void;
  onUpdateProduct: () => void;
}

export const EditProductDialog: React.FC<EditProductDialogProps> = ({
  editingProduct,
  onClose,
  activeCompanies,
  availableCurrencies,
  availableVendors,
  onEditProductFormChange,
  onUpdateProduct
}) => {
  if (!editingProduct) return null;

  return (
    <Dialog open={!!editingProduct} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Edit3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Edit Product</DialogTitle>
              <DialogDescription className="text-sm">
                Update your product or service information
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Company Selection Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-yellow-500 rounded-full"></div>
              Company Assignment
            </h3>
            
            <div>
              <Label htmlFor="edit-product-company" className="text-sm font-medium">Company *</Label>
              <Select 
                value={String(editingProduct.companyId)} 
                onValueChange={(value) => onEditProductFormChange('companyId', Number(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {activeCompanies.map(company => (
                    <SelectItem key={company.id} value={String(company.id)}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-yellow-600" />
                        <div>
                          <span className="font-medium">{company.tradingName}</span>
                          <p className="text-xs text-gray-500">({company.legalName})</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Choose which company this product belongs to
              </p>
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
              Basic Information
            </h3>
            
            <div>
              <Label htmlFor="edit-product-name" className="text-sm font-medium">Product/Service Name *</Label>
              <Input 
                id="edit-product-name" 
                placeholder="e.g., Web Development Service, iPhone 15 Pro"
                value={editingProduct.name}
                onChange={(e) => onEditProductFormChange('name', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a clear, descriptive name for your product or service
              </p>
            </div>
          </div>
          {/* Pricing Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
              Pricing Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-product-price" className="text-sm font-medium">Selling Price *</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="edit-product-price" 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={editingProduct.price}
                    onChange={(e) => onEditProductFormChange('price', parseFloat(e.target.value) || 0)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  The price you charge customers for this item
                </p>
              </div>
              
              <div>
                <Label htmlFor="edit-product-currency" className="text-sm font-medium">Currency</Label>
                <Select value={editingProduct.currency} onValueChange={(value) => onEditProductFormChange('currency', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map(currency => (
                      <SelectItem key={currency} value={currency}>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{currency}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Vendor Information Section */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
              Vendor Information
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </h3>
            
            <div>
              <Label htmlFor="edit-product-vendor" className="text-sm font-medium">Supplier/Vendor</Label>
              <Select 
                value={editingProduct.vendorId || 'N/A'} 
                onValueChange={(value) => onEditProductFormChange('vendorId', value === 'N/A' ? null : value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a vendor or leave as no vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N/A">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="font-medium">N/A (No Vendor)</span>
                        <p className="text-xs text-gray-500">This product has no specific supplier</p>
                      </div>
                    </div>
                  </SelectItem>
                  {availableVendors.map(vendor => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-purple-500" />
                        {vendor.companyName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Choose the vendor/supplier for this product (if applicable)
              </p>
            </div>
          </div>

          {/* Cost Information Section */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
              Cost Information (COGS)
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-product-cost" className="text-sm font-medium">Cost of Goods Sold</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="edit-product-cost" 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={editingProduct.cost}
                    onChange={(e) => onEditProductFormChange('cost', parseFloat(e.target.value) || 0)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  How much it costs you to produce/acquire this item
                </p>
              </div>
              
              <div>
                <Label htmlFor="edit-product-cost-currency" className="text-sm font-medium">Cost Currency</Label>
                <Select value={editingProduct.costCurrency} onValueChange={(value) => onEditProductFormChange('costCurrency', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map(currency => (
                      <SelectItem key={currency} value={currency}>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{currency}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {/* Additional Information Section */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-gray-500 rounded-full"></div>
              Additional Information
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </h3>
            
            <div>
              <Label htmlFor="edit-product-description" className="text-sm font-medium">Description</Label>
              <div className="relative mt-1">
                <Textarea 
                  id="edit-product-description" 
                  placeholder="Provide a detailed description of the product or service..."
                  value={editingProduct.description}
                  onChange={(e) => onEditProductFormChange('description', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <FileText className="absolute top-3 right-3 h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This description will help identify the product and may appear on invoices
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer with Actions */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            * Required fields
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="min-w-[100px]">
              Cancel
            </Button>
            <Button 
              onClick={onUpdateProduct}
              className="min-w-[120px] bg-blue-600 hover:bg-blue-700"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};