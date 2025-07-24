import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";

interface Client {
  id: string;
  name: string;
  email: string;
  status: string;
  address?: string;
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
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
          <DialogDescription className="text-sm">
            {editingInvoice 
              ? 'Update invoice information' 
              : globalSelectedCompany !== 'all' 
                ? `Creating invoice for ${companies.find(c => c.id === globalSelectedCompany)?.tradingName}` 
                : 'Create a new invoice for your client'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Client & Basic Info Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
              Client & Invoice Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Selection */}
              <div className="md:col-span-2">
                <Label className="text-sm font-medium">Client *</Label>
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
                  <SelectTrigger className="mt-1 bg-lime-50 border-lime-200 hover:bg-lime-100">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.filter(c => c.status !== 'ARCHIVED').map(client => (
                      <SelectItem key={`client-form-${client.id}`} value={client.id}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{client.name}</span>
                          <span className="text-sm text-gray-500 ml-2">{client.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice Number */}
              <div>
                <Label className="text-sm font-medium">Invoice Number</Label>
                <Input
                  className="mt-1"
                  placeholder="Auto-generated"
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) => onFormChange('invoiceNumber', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for auto-generation
                </p>
              </div>

              {/* Tax Rate */}
              <div>
                <Label className="text-sm font-medium">Tax Rate (%)</Label>
                <Input 
                  className="mt-1"
                  type="number" 
                  placeholder="0"
                  value={invoiceForm.taxRate}
                  onChange={(e) => onFormChange('taxRate', e.target.value)}
                />
              </div>

              {/* Issue Date */}
              <div>
                <Label className="text-sm font-medium">Issue Date *</Label>
                <Input 
                  className="mt-1 bg-lime-50 border-lime-200 focus:bg-white"
                  type="date"
                  value={invoiceForm.issueDate}
                  onChange={(e) => onFormChange('issueDate', e.target.value)}
                />
              </div>

              {/* Due Date */}
              <div>
                <Label className="text-sm font-medium">Due Date *</Label>
                <Input 
                  className="mt-1 bg-lime-50 border-lime-200 focus:bg-white"
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) => onFormChange('dueDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
                Products/Services *
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddFormItem}
                className="text-sm"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {invoiceForm.items.map((item, index) => (
                <div key={`item-${index}`} className="flex gap-2 items-start bg-gray-50 p-3 rounded-md">
                  <div className="flex-1">
                    {index === 0 && <Label className="text-xs font-medium text-gray-600 mb-1">Product</Label>}
                    <Select
                      value={item.productId}
                      onValueChange={(value) => onUpdateFormItemProduct(index, value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeProducts.map(product => (
                          <SelectItem key={`product-${product.id}`} value={product.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{product.name}</span>
                              <span className="text-sm text-gray-500 ml-2">{product.currency} {product.price}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20">
                    {index === 0 && <Label className="text-xs font-medium text-gray-600 mb-1">Qty</Label>}
                    <Input
                      className="h-9"
                      type="number"
                      placeholder="1"
                      value={item.quantity}
                      onChange={(e) => onUpdateFormItemQuantity(index, e.target.value)}
                    />
                  </div>
                  <div className="w-9">
                    {index === 0 && <Label className="text-xs font-medium text-gray-600 mb-1">&nbsp;</Label>}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFormItem(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {invoiceForm.items.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-md">
                  <div className="text-sm">No items added</div>
                  <div className="text-xs mt-1">Click "Add Item" to start</div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
              Payment Methods *
            </h3>
            <div className="space-y-2">
              {formPaymentMethods.length === 0 ? (
                <div className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="font-medium text-yellow-800">No payment methods available</p>
                  <p className="text-xs text-yellow-700 mt-1">Add bank accounts or digital wallets in Accounting → Banks & Wallets</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {formPaymentMethods.map(method => (
                    <label 
                      key={`payment-method-${method.id}`} 
                      htmlFor={`payment-${method.id}`}
                      className="flex items-start p-3 bg-white border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        id={`payment-${method.id}`}
                        checked={invoiceForm.paymentMethodIds.includes(method.id)}
                        onChange={(e) => onPaymentMethodToggle(method.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3 mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 break-words">{method.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{method.type}</p>
                          </div>
                          {method.currency && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              {method.currency}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <Label className="text-sm font-medium text-gray-700">Additional Notes</Label>
            <Textarea
              className="mt-1 resize-none"
              placeholder="Add any additional notes or instructions for this invoice..."
              value={invoiceForm.notes}
              onChange={(e) => onFormChange('notes', e.target.value)}
              rows={2}
            />
          </div>
        </div>
        
        {/* Footer with Actions */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            * Required fields
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onResetForm} className="min-w-[100px]">
              Cancel
            </Button>
            <Button 
              onClick={editingInvoice ? onUpdateInvoice : onCreateInvoice}
              className="min-w-[120px] bg-blue-600 hover:bg-blue-700"
            >
              {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};