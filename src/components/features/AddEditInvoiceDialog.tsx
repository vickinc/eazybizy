import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Plus from "lucide-react/dist/esm/icons/plus";
import Minus from "lucide-react/dist/esm/icons/minus";

interface Client {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  currency?: string;
}

interface InvoiceForm {
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  taxRate: string;
  items: Array<{
    productId: string;
    quantity: string;
  }>;
  paymentMethodIds: string[];
  notes: string;
}

interface Company {
  id: string;
  tradingName: string;
}

interface AddEditInvoiceDialogProps {
  isOpen: boolean;
  editingInvoice: unknown | null;
  invoiceForm: InvoiceForm;
  clients: Client[];
  activeProducts: Product[];
  formPaymentMethods: PaymentMethod[];
  companies: Company[];
  globalSelectedCompany: string;
  onClose: () => void;
  onFormChange: (field: string, value: unknown) => void;
  onAddFormItem: () => void;
  onRemoveFormItem: (index: number) => void;
  onUpdateFormItemProduct: (index: number, productId: string) => void;
  onUpdateFormItemQuantity: (index: number, quantity: string) => void;
  onPaymentMethodToggle: (methodId: string, checked: boolean) => void;
  onCreateInvoice: () => void;
  onUpdateInvoice: () => void;
  onResetForm: () => void;
}

export const AddEditInvoiceDialog: React.FC<AddEditInvoiceDialogProps> = ({
  isOpen,
  editingInvoice,
  invoiceForm,
  clients,
  activeProducts,
  formPaymentMethods,
  companies,
  globalSelectedCompany,
  onClose,
  onFormChange,
  onAddFormItem,
  onRemoveFormItem,
  onUpdateFormItemProduct,
  onUpdateFormItemQuantity,
  onPaymentMethodToggle,
  onCreateInvoice,
  onUpdateInvoice,
  onResetForm,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
          <DialogDescription>
            {editingInvoice 
              ? 'Update invoice information' 
              : globalSelectedCompany !== 'all' 
                ? `Creating invoice for ${companies.find(c => c.id === globalSelectedCompany)?.tradingName}` 
                : 'Create a new invoice for your client'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {/* Client Selection - Full width to prevent overlap */}
          <div>
            <Label>Client *</Label>
            <Select 
              value={invoiceForm.clientId} 
              onValueChange={(value) => {
                const selectedClient = clients.find(c => c.id === value);
                if (selectedClient) {
                  onFormChange('clientId', value);
                  onFormChange('clientName', selectedClient.name);
                  onFormChange('clientEmail', selectedClient.email);
                  onFormChange('clientAddress', selectedClient.address || '');
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.filter(c => c.status !== 'ARCHIVED').map(client => (
                  <SelectItem key={`client-form-${client.id}`} value={client.id}>
                    {client.name} ({client.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Number - Separate row */}
          <div>
            <Label>Invoice Number</Label>
            <Input
              placeholder="Auto-generated if empty"
              value={invoiceForm.invoiceNumber}
              onChange={(e) => onFormChange('invoiceNumber', e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1">
              Leave empty to auto-generate (e.g., INV-2025-0001)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Issue Date */}
            <div>
              <Label>Issue Date *</Label>
              <Input 
                type="date"
                value={invoiceForm.issueDate}
                onChange={(e) => onFormChange('issueDate', e.target.value)}
              />
            </div>

            {/* Due Date */}
            <div>
              <Label>Due Date *</Label>
              <Input 
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) => onFormChange('dueDate', e.target.value)}
              />
            </div>

            {/* Tax Rate */}
            <div>
              <Label>Tax Rate (%)</Label>
              <Input 
                type="number" 
                placeholder="0"
                value={invoiceForm.taxRate}
                onChange={(e) => onFormChange('taxRate', e.target.value)}
              />
            </div>
          </div>

          {/* Products Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-semibold">Products/Services *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddFormItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {invoiceForm.items.map((item, index) => (
                <div key={`item-${index}`} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>Product</Label>
                    <Select
                      value={item.productId}
                      onValueChange={(value) => onUpdateFormItemProduct(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeProducts.map(product => (
                          <SelectItem key={`product-${product.id}`} value={product.id}>
                            {product.name} - {product.currency} {product.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={item.quantity}
                      onChange={(e) => onUpdateFormItemQuantity(index, e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFormItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {invoiceForm.items.length === 0 && (
                <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded">
                  No items added. Click "Add Item" to start.
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <Label className="text-lg font-semibold">Payment Methods *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {formPaymentMethods.length === 0 ? (
                <div className="text-sm text-gray-500 italic">
                  No payment methods available. Add bank accounts or digital wallets in Accounting → Banks & Wallets.
                </div>
              ) : formPaymentMethods.map(method => (
                  <div key={`payment-method-${method.id}`} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`payment-${method.id}`}
                      checked={invoiceForm.paymentMethodIds.includes(method.id)}
                      onChange={(e) => onPaymentMethodToggle(method.id, e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor={`payment-${method.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                      <span>{method.name} ({method.type})</span>
                      {method.currency && (
                        <Badge variant="secondary" className="text-xs">
                          {method.currency}
                        </Badge>
                      )}
                    </label>
                  </div>
                ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes for the invoice..."
              value={invoiceForm.notes}
              onChange={(e) => onFormChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onResetForm}>
              Cancel
            </Button>
            <Button onClick={editingInvoice ? onUpdateInvoice : onCreateInvoice}>
              {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};