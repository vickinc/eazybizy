"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Package, ExternalLink, X, Building2 } from "lucide-react";
import { FormattedVendor, VendorFormData } from "@/types/vendor.types";
import { Product } from "@/types/products.types";

interface Company {
  id: number;
  tradingName: string;
}

interface PaymentTermsOption {
  value: string;
  label: string;
}

interface PaymentMethod {
  value: string;
  label: string;
}

interface ProductWithFormattedPrice extends Product {
  formattedPrice: string;
}

interface AddEditVendorDialogProps {
  open: boolean;
  editingVendor: FormattedVendor | null;
  vendorForm: VendorFormData;
  customPaymentTerms: string;
  productSearchTerm: string;
  selectedCompanyName: string;
  availableCountries: string[];
  availablePaymentTermsOptions: PaymentTermsOption[];
  availableCurrencies: string[];
  availablePaymentMethods: PaymentMethod[];
  onClose: () => void;
  onVendorFormChange: (field: keyof VendorFormData, value: any) => void;
  onCustomPaymentTermsChange: (value: string) => void;
  onProductSearchTermChange: (value: string) => void;
  onProductToggle: (productId: string) => void;
  onNavigateToProducts: () => void;
  onCreateVendor: () => void;
  onUpdateVendor: () => void;
  getFilteredProducts: () => ProductWithFormattedPrice[];
  getSelectedProducts: () => ProductWithFormattedPrice[];
}

export const AddEditVendorDialog: React.FC<AddEditVendorDialogProps> = ({
  open,
  editingVendor,
  vendorForm,
  customPaymentTerms,
  productSearchTerm,
  selectedCompanyName,
  availableCountries,
  availablePaymentTermsOptions,
  availableCurrencies,
  availablePaymentMethods,
  onClose,
  onVendorFormChange,
  onCustomPaymentTermsChange,
  onProductSearchTermChange,
  onProductToggle,
  onNavigateToProducts,
  onCreateVendor,
  onUpdateVendor,
  getFilteredProducts,
  getSelectedProducts
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
          </DialogTitle>
          <DialogDescription>
            {editingVendor 
              ? 'Update vendor information for expense tracking.' 
              : 'Enter vendor information for better expense tracking.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Company Info Display */}
          {!editingVendor && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                  <Label className="text-sm font-medium text-blue-800">Adding vendor for:</Label>
                  <p className="text-lg font-semibold text-blue-900">{selectedCompanyName}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Vendor Company Name *</Label>
              <Input
                id="companyName"
                placeholder="Enter vendor company name"
                value={vendorForm.companyName}
                onChange={(e) => onVendorFormChange('companyName', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input
                id="contactPerson"
                placeholder="Enter contact person name"
                value={vendorForm.contactPerson}
                onChange={(e) => onVendorFormChange('contactPerson', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="Enter contact email"
                value={vendorForm.contactEmail}
                onChange={(e) => onVendorFormChange('contactEmail', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number (optional)"
                value={vendorForm.phone}
                onChange={(e) => onVendorFormChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                placeholder="Enter website URL (optional)"
                value={vendorForm.website}
                onChange={(e) => onVendorFormChange('website', e.target.value)}
              />
            </div>
            <div>
              {/* Empty div for grid layout consistency */}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyRegistrationNr">Company Registration Nr.</Label>
              <Input
                id="companyRegistrationNr"
                placeholder="Enter company registration number"
                value={vendorForm.companyRegistrationNr}
                onChange={(e) => onVendorFormChange('companyRegistrationNr', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="vatNr">VAT Number</Label>
              <Input
                id="vatNr"
                placeholder="Enter VAT number"
                value={vendorForm.vatNr}
                onChange={(e) => onVendorFormChange('vatNr', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="vendorCountry">Vendor Country</Label>
            <Select value={vendorForm.vendorCountry} onValueChange={(value) => onVendorFormChange('vendorCountry', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select country (type to search)" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {availableCountries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              Type to search through countries
            </p>
          </div>

          <div>
            <Label htmlFor="itemsServicesSold">Items/Services Sold</Label>
            <Textarea
              id="itemsServicesSold"
              placeholder="Describe the items or services this vendor provides"
              value={vendorForm.itemsServicesSold}
              onChange={(e) => onVendorFormChange('itemsServicesSold', e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Select 
                value={vendorForm.paymentTerms} 
                onValueChange={(value) => onVendorFormChange('paymentTerms', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePaymentTermsOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {vendorForm.paymentTerms === 'custom' && (
              <div>
                <Label htmlFor="customPaymentTerms">Custom Days</Label>
                <Input
                  id="customPaymentTerms"
                  type="number"
                  placeholder="Enter days"
                  value={customPaymentTerms}
                  onChange={(e) => onCustomPaymentTermsChange(e.target.value)}
                  min="1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={vendorForm.currency} onValueChange={(value) => onVendorFormChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={vendorForm.paymentMethod} onValueChange={(value) => onVendorFormChange('paymentMethod', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePaymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="billingAddress">Billing Address</Label>
            <Textarea
              id="billingAddress"
              placeholder="Enter billing address (optional)"
              value={vendorForm.billingAddress}
              onChange={(e) => onVendorFormChange('billingAddress', e.target.value)}
              rows={3}
            />
          </div>

          {/* Products Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-medium">Products</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onNavigateToProducts}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Add Product
              </Button>
            </div>
            
            {/* Product Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={productSearchTerm}
                onChange={(e) => onProductSearchTermChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selected Products */}
            {getSelectedProducts().length > 0 && (
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-700 mb-2">Selected Products:</div>
                <div className="flex flex-wrap gap-2">
                  {getSelectedProducts().map(product => (
                    <Badge
                      key={product.id}
                      variant="secondary"
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      <Package className="h-3 w-3" />
                      {product.name}
                      <button
                        type="button"
                        onClick={() => onProductToggle(product.id)}
                        className="ml-1 hover:bg-blue-300 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Available Products */}
            <div className="border rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto">
              {getFilteredProducts().length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  {productSearchTerm ? 'No products match your search' : 'No products available'}
                </div>
              ) : (
                <div className="space-y-2">
                  {getFilteredProducts().map(product => (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                        vendorForm.productIds?.includes(product.id) || false
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => onProductToggle(product.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-600" />
                        <div>
                          <div className="font-medium text-sm">{product.name}</div>
                          {product.description && (
                            <div className="text-xs text-gray-500">{product.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {product.formattedPrice}
                        </Badge>
                        <input
                          type="checkbox"
                          checked={vendorForm.productIds?.includes(product.id) || false}
                          onChange={(e) => {
                            e.stopPropagation();
                            onProductToggle(product.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Select products that this vendor supplies. You can add new products using the "Add Product" button.
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this vendor"
              value={vendorForm.notes}
              onChange={(e) => onVendorFormChange('notes', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={editingVendor ? onUpdateVendor : onCreateVendor}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {editingVendor ? 'Update Vendor' : 'Create Vendor'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};