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

interface NewProduct {
  name: string;
  price: string;
  currency: string;
  vendorId: string;
  cost: string;
  costCurrency: string;
  description: string;
}

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  newProduct: NewProduct;
  selectedCompanyName: string;
  availableCurrencies: string[];
  availableVendors: Vendor[];
  onProductFormChange: (field: keyof NewProduct, value: unknown) => void;
  onCreateProduct: () => void;
  onResetForm: () => void;
}

export const AddProductDialog: React.FC<AddProductDialogProps> = ({
  isOpen,
  onClose,
  newProduct,
  selectedCompanyName,
  availableCurrencies,
  availableVendors,
  onProductFormChange,
  onCreateProduct,
  onResetForm
}) => {
  const handleClose = () => {
    onClose();
    onResetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Add New Product</DialogTitle>
              <DialogDescription className="text-sm">
                Create a new product or service for your invoices
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Company Selection Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-yellow-500 rounded-full"></div>
              Company Assignment
            </h3>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Building2 className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <Label className="text-sm font-medium text-yellow-800">Adding product for:</Label>
                <p className="text-lg font-semibold text-yellow-900">{selectedCompanyName}</p>
              </div>
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="product-name" className="text-sm font-medium">Product/Service Name *</Label>
                <Input 
                  id="product-name" 
                  placeholder="e.g., Web Development Service, iPhone 15 Pro"
                  value={newProduct.name}
                  onChange={(e) => onProductFormChange('name', e.target.value)}
                  className="mt-1 bg-lime-50 border-lime-200 focus:bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a clear, descriptive name for your product or service
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
              Pricing Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-price" className="text-sm font-medium">Selling Price *</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="product-price" 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newProduct.price}
                    onChange={(e) => onProductFormChange('price', e.target.value)}
                    className="pl-10 bg-lime-50 border-lime-200 focus:bg-white"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  The price you charge customers for this item
                </p>
              </div>
              
              <div>
                <Label htmlFor="product-currency" className="text-sm font-medium">Currency</Label>
                <Select value={newProduct.currency} onValueChange={(value) => onProductFormChange('currency', value)}>
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
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
              Vendor Information
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </h3>
            
            <div>
              <Label htmlFor="product-vendor" className="text-sm font-medium">Supplier/Vendor</Label>
              <Select 
                value={newProduct.vendorId} 
                onValueChange={(value) => onProductFormChange('vendorId', value)}
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
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
              Cost Information (COGS)
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-cost" className="text-sm font-medium">Cost of Goods Sold</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="product-cost" 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newProduct.cost}
                    onChange={(e) => onProductFormChange('cost', e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  How much it costs you to produce/acquire this item
                </p>
              </div>
              
              <div>
                <Label htmlFor="product-cost-currency" className="text-sm font-medium">Cost Currency</Label>
                <Select value={newProduct.costCurrency} onValueChange={(value) => onProductFormChange('costCurrency', value)}>
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
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
              Additional Information
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </h3>
            
            <div>
              <Label htmlFor="product-description" className="text-sm font-medium">Description</Label>
              <div className="relative mt-1">
                <Textarea 
                  id="product-description" 
                  placeholder="Provide a detailed description of the product or service..."
                  value={newProduct.description}
                  onChange={(e) => onProductFormChange('description', e.target.value)}
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
            <Button variant="outline" onClick={handleClose} className="min-w-[100px]">
              Cancel
            </Button>
            <Button 
              onClick={onCreateProduct}
              className="min-w-[120px] bg-green-600 hover:bg-green-700"
            >
              <Package className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};