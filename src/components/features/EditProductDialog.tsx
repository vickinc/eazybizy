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
  onEditProductFormChange: (field: keyof EditingProduct, value: any) => void;
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update product information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="edit-product-company">Company *</Label>
              <Select 
                value={String(editingProduct.companyId)} 
                onValueChange={(value) => onEditProductFormChange('companyId', Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activeCompanies.map(company => (
                    <SelectItem key={company.id} value={String(company.id)}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {company.tradingName} ({company.legalName})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-product-name">Product/Service Name *</Label>
              <Input 
                id="edit-product-name" 
                value={editingProduct.name}
                onChange={(e) => onEditProductFormChange('name', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-product-price">Price *</Label>
              <Input 
                id="edit-product-price" 
                type="number"
                step="0.01"
                value={editingProduct.price}
                onChange={(e) => onEditProductFormChange('price', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="edit-product-currency">Currency</Label>
              <Select value={editingProduct.currency} onValueChange={(value) => onEditProductFormChange('currency', value)}>
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
              <Label htmlFor="edit-product-vendor">Vendor</Label>
              <Select 
                value={editingProduct.vendorId || 'N/A'} 
                onValueChange={(value) => onEditProductFormChange('vendorId', value === 'N/A' ? null : value)}
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
              <Label htmlFor="edit-product-cost">COGS</Label>
              <Input 
                id="edit-product-cost" 
                type="number"
                step="0.01"
                value={editingProduct.cost}
                onChange={(e) => onEditProductFormChange('cost', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="edit-product-cost-currency">COGS Currency</Label>
              <Select value={editingProduct.costCurrency} onValueChange={(value) => onEditProductFormChange('costCurrency', value)}>
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
            <Label htmlFor="edit-product-description">Description</Label>
            <Textarea 
              id="edit-product-description" 
              value={editingProduct.description}
              onChange={(e) => onEditProductFormChange('description', e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onUpdateProduct}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};