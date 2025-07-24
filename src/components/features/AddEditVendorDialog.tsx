"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Search from "lucide-react/dist/esm/icons/search";
import Package from "lucide-react/dist/esm/icons/package";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import X from "lucide-react/dist/esm/icons/x";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import UserCheck from "lucide-react/dist/esm/icons/user-check";
import Mail from "lucide-react/dist/esm/icons/mail";
import Phone from "lucide-react/dist/esm/icons/phone";
import Globe from "lucide-react/dist/esm/icons/globe";
import FileText from "lucide-react/dist/esm/icons/file-text";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Edit3 from "lucide-react/dist/esm/icons/edit-3";
import Plus from "lucide-react/dist/esm/icons/plus";
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
  onVendorFormChange: (field: keyof VendorFormData, value: unknown) => void;
  onCustomPaymentTermsChange: (value: string) => void;
  onProductSearchTermChange: (value: string) => void;
  onProductToggle: (productId: string) => void;
  onNavigateToProducts: () => void;
  onOpenAddProductDialog: () => void;
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
  onOpenAddProductDialog,
  onCreateVendor,
  onUpdateVendor,
  getFilteredProducts,
  getSelectedProducts
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${editingVendor ? 'bg-blue-100' : 'bg-purple-100'}`}>
              {editingVendor ? (
                <Edit3 className="h-6 w-6 text-blue-600" />
              ) : (
                <Plus className="h-6 w-6 text-purple-600" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingVendor 
                  ? 'Update vendor information for expense tracking' 
                  : 'Enter vendor information for better expense tracking'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Company Selection Section */}
          {!editingVendor && (
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
                  <Label className="text-sm font-medium text-yellow-800">Adding vendor for:</Label>
                  <p className="text-lg font-semibold text-yellow-900">{selectedCompanyName}</p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName" className="text-sm font-medium">Vendor Company Name *</Label>
                <div className="relative mt-1">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="companyName"
                    placeholder="e.g., ABC Supplies Ltd, John's Services"
                    value={vendorForm.companyName}
                    onChange={(e) => onVendorFormChange('companyName', e.target.value)}
                    className="pl-10 bg-lime-50 border-lime-200 focus:bg-white"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  The official name of the vendor company
                </p>
              </div>

              <div>
                <Label htmlFor="contactPerson" className="text-sm font-medium">Contact Person *</Label>
                <div className="relative mt-1">
                  <UserCheck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="contactPerson"
                    placeholder="e.g., John Smith, Sarah Johnson"
                    value={vendorForm.contactPerson}
                    onChange={(e) => onVendorFormChange('contactPerson', e.target.value)}
                    className="pl-10 bg-lime-50 border-lime-200 focus:bg-white"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Primary contact person at the vendor
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactEmail" className="text-sm font-medium">Contact Email *</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="contact@vendor.com"
                    value={vendorForm.contactEmail}
                    onChange={(e) => onVendorFormChange('contactEmail', e.target.value)}
                    className="pl-10 bg-lime-50 border-lime-200 focus:bg-white"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Primary email for business communication
                </p>
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={vendorForm.phone}
                    onChange={(e) => onVendorFormChange('phone', e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Phone number for direct contact (optional)
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website" className="text-sm font-medium">Website</Label>
                  <div className="relative mt-1">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="website"
                      placeholder="https://vendor-website.com"
                      value={vendorForm.website}
                      onChange={(e) => onVendorFormChange('website', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Vendor's official website (optional)
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="vendorCountry" className="text-sm font-medium">Country</Label>
                  <Select value={vendorForm.vendorCountry} onValueChange={(value) => onVendorFormChange('vendorCountry', value)}>
                    <SelectTrigger id="vendorCountry" className="mt-1 w-full">
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
                  <p className="text-xs text-gray-500 mt-1">
                    Type to search through countries
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Legal & Business Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
              Legal & Business Information
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyRegistrationNr" className="text-sm font-medium">Company Registration Number</Label>
                <div className="relative mt-1">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="companyRegistrationNr"
                    placeholder="e.g., 123456789"
                    value={vendorForm.companyRegistrationNr}
                    onChange={(e) => onVendorFormChange('companyRegistrationNr', e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Official company registration number
                </p>
              </div>

              <div>
                <Label htmlFor="vatNr" className="text-sm font-medium">VAT Number</Label>
                <div className="relative mt-1">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="vatNr"
                    placeholder="e.g., GB123456789"
                    value={vendorForm.vatNr}
                    onChange={(e) => onVendorFormChange('vatNr', e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tax identification number
                </p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="itemsServicesSold" className="text-sm font-medium">Items/Services Sold</Label>
              <Textarea
                id="itemsServicesSold"
                placeholder="Describe the items or services this vendor provides..."
                value={vendorForm.itemsServicesSold}
                onChange={(e) => onVendorFormChange('itemsServicesSold', e.target.value)}
                rows={2}
                className="mt-1 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Brief description of what this vendor supplies
              </p>
            </div>
          </div>

          {/* Payment & Terms Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
              Payment & Terms
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </h3>
            
            <div className="space-y-4">
              {/* First Row: Payment Terms and Custom Days (if applicable) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentTerms" className="text-sm font-medium">Payment Terms</Label>
                  <Select 
                    value={vendorForm.paymentTerms} 
                    onValueChange={(value) => onVendorFormChange('paymentTerms', value)}
                  >
                    <SelectTrigger id="paymentTerms" className="mt-1 w-full">
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePaymentTermsOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    How long you have to pay invoices
                  </p>
                </div>

                {vendorForm.paymentTerms === 'custom' && (
                  <div>
                    <Label htmlFor="customPaymentTerms" className="text-sm font-medium">Custom Days</Label>
                    <Input
                      id="customPaymentTerms"
                      type="number"
                      placeholder="Enter days"
                      value={customPaymentTerms}
                      onChange={(e) => onCustomPaymentTermsChange(e.target.value)}
                      min="1"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of days to pay
                    </p>
                  </div>
                )}
              </div>

              {/* Second Row: Currency and Payment Method */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
                  <Select value={vendorForm.currency} onValueChange={(value) => onVendorFormChange('currency', value)}>
                    <SelectTrigger id="currency" className="mt-1 w-full">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCurrencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{currency}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Default currency for this vendor
                  </p>
                </div>

                <div>
                  <Label htmlFor="paymentMethod" className="text-sm font-medium">Payment Method</Label>
                  <Select value={vendorForm.paymentMethod} onValueChange={(value) => onVendorFormChange('paymentMethod', value)}>
                    <SelectTrigger id="paymentMethod" className="mt-1 w-full">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePaymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-gray-500" />
                            {method.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    How you typically pay this vendor
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
              Address Information
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </h3>
            
            <div>
              <Label htmlFor="billingAddress" className="text-sm font-medium">Billing Address</Label>
              <div className="relative mt-1">
                <Textarea
                  id="billingAddress"
                  placeholder="123 Business St, Suite 100&#10;City, State 12345&#10;Country"
                  value={vendorForm.billingAddress}
                  onChange={(e) => onVendorFormChange('billingAddress', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <MapPin className="absolute top-3 right-3 h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Full billing address for invoices and payments
              </p>
            </div>
          </div>

          {/* Products Selection Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
              Products & Services
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Associate Products</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Link products that this vendor supplies for better tracking
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenAddProductDialog}
                className="flex items-center gap-2 shrink-0"
              >
                <Plus className="h-4 w-4" />
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
            <p className="text-xs text-gray-500">
              Select products that this vendor supplies. You can add new products using the "Add Product" button above.
            </p>
          </div>

          {/* Additional Notes Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
              Additional Notes
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </h3>
            
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
              <div className="relative mt-1">
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about this vendor, special terms, or other important information..."
                  value={vendorForm.notes}
                  onChange={(e) => onVendorFormChange('notes', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <FileText className="absolute top-3 right-3 h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Any additional information about this vendor
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
              onClick={editingVendor ? onUpdateVendor : onCreateVendor}
              className={`min-w-[140px] ${editingVendor ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              {editingVendor ? (
                <>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Update Vendor
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Vendor
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};