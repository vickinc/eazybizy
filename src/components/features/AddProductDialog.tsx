import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Package, Truck } from "lucide-react";

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>Create a new product or service for your invoices</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Company Info Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <Label className="text-sm font-medium text-blue-800">Adding product for:</Label>
                <p className="text-lg font-semibold text-blue-900">{selectedCompanyName}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="product-name">Product/Service Name *</Label>
              <Input 
                id="product-name" 
                placeholder="Enter product name"
                value={newProduct.name}
                onChange={(e) => onProductFormChange('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="product-price">Price *</Label>
              <Input 
                id="product-price" 
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newProduct.price}
                onChange={(e) => onProductFormChange('price', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="product-currency">Currency</Label>
              <Select value={newProduct.currency} onValueChange={(value) => onProductFormChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map(currency => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="product-vendor">Vendor</Label>
              <Select 
                value={newProduct.vendorId} 
                onValueChange={(value) => onProductFormChange('vendorId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N/A">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      N/A (No Vendor)
                    </div>
                  </SelectItem>
                  {availableVendors.map(vendor => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-blue-500" />
                        {vendor.companyName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="product-cost">COGS</Label>
              <Input 
                id="product-cost" 
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newProduct.cost}
                onChange={(e) => onProductFormChange('cost', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="product-cost-currency">COGS Currency</Label>
              <Select value={newProduct.costCurrency} onValueChange={(value) => onProductFormChange('costCurrency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map(currency => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="product-description">Description</Label>
            <Textarea 
              id="product-description" 
              placeholder="Describe the product or service"
              value={newProduct.description}
              onChange={(e) => onProductFormChange('description', e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={onCreateProduct}>Add Product</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};