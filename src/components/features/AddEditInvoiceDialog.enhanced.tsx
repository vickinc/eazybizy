import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { invoicesApiService, InvoiceFormData, Invoice } from '@/services/api/invoicesApiService.enhanced';

interface Client {
  id: string;
  name: string;
  email: string;
  address?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  description?: string;
}

interface Company {
  id: number;
  tradingName: string;
  legalName?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
}

interface InvoiceItem {
  productId: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  total: number;
}

interface AddEditInvoiceDialogEnhancedProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingInvoice?: Invoice | null;
  companies: Company[];
  clients: Client[];
  products: Product[];
  paymentMethods: PaymentMethod[];
  onInvoiceCreated?: (invoice: Invoice) => void;
  onInvoiceUpdated?: (invoice: Invoice) => void;
  initialCompanyId?: number;
}

export const AddEditInvoiceDialogEnhanced: React.FC<AddEditInvoiceDialogEnhancedProps> = ({
  isOpen,
  onOpenChange,
  editingInvoice = null,
  companies,
  clients,
  products,
  paymentMethods,
  onInvoiceCreated,
  onInvoiceUpdated,
  initialCompanyId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: '',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    clientId: '',
    subtotal: 0,
    currency: 'USD',
    status: 'DRAFT',
    dueDate: '',
    issueDate: new Date().toISOString().split('T')[0],
    template: 'standard',
    taxRate: 0,
    taxAmount: 0,
    totalAmount: 0,
    fromCompanyId: initialCompanyId || (companies[0]?.id || 0),
    notes: '',
    items: [],
    paymentMethodIds: []
  });

  // Generate invoice number
  const generateInvoiceNumber = async () => {
    try {
      const nextNumber = await invoicesApiService.getNextInvoiceNumber(formData.fromCompanyId);
      setFormData(prev => ({ ...prev, invoiceNumber: nextNumber }));
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to timestamp-based number
      const fallbackNumber = `INV-${Date.now()}`;
      setFormData(prev => ({ ...prev, invoiceNumber: fallbackNumber }));
    }
  };

  // Reset form when dialog opens/closes or editing invoice changes
  useEffect(() => {
    if (isOpen) {
      if (editingInvoice) {
        setFormData({
          invoiceNumber: editingInvoice.invoiceNumber,
          clientName: editingInvoice.clientName,
          clientEmail: editingInvoice.clientEmail,
          clientAddress: editingInvoice.clientAddress || '',
          clientId: editingInvoice.clientId || '',
          subtotal: editingInvoice.subtotal,
          currency: editingInvoice.currency,
          status: editingInvoice.status,
          dueDate: editingInvoice.dueDate,
          issueDate: editingInvoice.issueDate,
          template: editingInvoice.template,
          taxRate: editingInvoice.taxRate,
          taxAmount: editingInvoice.taxAmount,
          totalAmount: editingInvoice.totalAmount,
          fromCompanyId: editingInvoice.fromCompanyId,
          notes: editingInvoice.notes || '',
          items: editingInvoice.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            currency: item.currency,
            total: item.total
          })),
          paymentMethodIds: editingInvoice.paymentMethodInvoices?.map(pm => pm.paymentMethodId) || []
        });
      } else {
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 30);
        
        setFormData({
          invoiceNumber: '',
          clientName: '',
          clientEmail: '',
          clientAddress: '',
          clientId: '',
          subtotal: 0,
          currency: 'USD',
          status: 'DRAFT',
          dueDate: defaultDueDate.toISOString().split('T')[0],
          issueDate: new Date().toISOString().split('T')[0],
          template: 'standard',
          taxRate: 0,
          taxAmount: 0,
          totalAmount: 0,
          fromCompanyId: initialCompanyId || (companies[0]?.id || 0),
          notes: '',
          items: [],
          paymentMethodIds: []
        });
        
        // Generate invoice number for new invoices
        if (!editingInvoice) {
          generateInvoiceNumber();
        }
      }
    }
  }, [isOpen, editingInvoice, initialCompanyId, companies]);

  // Calculate totals when items, tax rate changes
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * formData.taxRate) / 100;
    const totalAmount = subtotal + taxAmount;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      totalAmount
    }));
  }, [formData.items, formData.taxRate]);

  const handleInputChange = (field: keyof InvoiceFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        clientAddress: client.address || ''
      }));
    }
  };

  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      productId: '',
      productName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      currency: formData.currency,
      total: 0
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeInvoiceItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          // Auto-calculate total when quantity or unit price changes
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          }
          
          // Auto-fill product details when product is selected
          if (field === 'productId') {
            const product = products.find(p => p.id === value);
            if (product) {
              updatedItem.productName = product.name;
              updatedItem.description = product.description || '';
              updatedItem.unitPrice = product.price;
              updatedItem.currency = product.currency;
              updatedItem.total = updatedItem.quantity * product.price;
            }
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.invoiceNumber.trim()) {
      toast.error('Please enter an invoice number');
      return;
    }
    
    if (!formData.clientName.trim() || !formData.clientEmail.trim()) {
      toast.error('Please enter client name and email');
      return;
    }
    
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    
    if (!formData.fromCompanyId) {
      toast.error('Please select a company');
      return;
    }

    setIsLoading(true);
    
    try {
      if (editingInvoice) {
        // Update existing invoice
        const updatedInvoice = await invoicesApiService.updateInvoice(editingInvoice.id, formData);
        toast.success('Invoice updated successfully');
        onInvoiceUpdated?.(updatedInvoice);
      } else {
        // Create new invoice
        const newInvoice = await invoicesApiService.createInvoice(formData);
        toast.success('Invoice created successfully');
        onInvoiceCreated?.(newInvoice);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error(editingInvoice ? 'Failed to update invoice' : 'Failed to create invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const availablePaymentMethods = paymentMethods.filter(pm => 
    // Filter by company if needed
    true // Add company filtering logic here if payment methods are company-specific
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingInvoice ? 'Edit' : 'Create'} Invoice
          </DialogTitle>
          <DialogDescription>
            {editingInvoice ? 'Update the invoice details' : 'Create a new invoice for your client'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Invoice Number */}
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number *</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                placeholder="INV-001"
                required
              />
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="fromCompanyId">From Company *</Label>
              <Select
                value={formData.fromCompanyId.toString()}
                onValueChange={(value) => handleInputChange('fromCompanyId', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.tradingName || company.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Issue Date */}
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date *</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => handleInputChange('issueDate', e.target.value)}
                required
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                required
              />
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleInputChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'ARCHIVED') => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Selection */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="clientId">Select Existing Client</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={handleClientSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client or enter details manually" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Client Name */}
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    placeholder="Client name"
                    required
                  />
                </div>

                {/* Client Email */}
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                    placeholder="client@example.com"
                    required
                  />
                </div>

                {/* Client Address */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="clientAddress">Client Address</Label>
                  <Textarea
                    id="clientAddress"
                    value={formData.clientAddress}
                    onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                    placeholder="Client address"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Invoice Items</h3>
                <Button
                  type="button"
                  onClick={addInvoiceItem}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      {/* Product Selection */}
                      <div className="md:col-span-3">
                        <Label>Product</Label>
                        <Select
                          value={item.productId}
                          onValueChange={(value) => updateInvoiceItem(index, 'productId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - {product.currency} {product.price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Description */}
                      <div className="md:col-span-3">
                        <Label>Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="md:col-span-2">
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      {/* Total */}
                      <div className="md:col-span-1">
                        <Label>Total</Label>
                        <div className="text-sm font-medium py-2">
                          {item.total.toFixed(2)}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div className="md:col-span-1">
                        <Button
                          type="button"
                          onClick={() => removeInvoiceItem(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {formData.items.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No items added yet. Click "Add Item" to get started.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tax and Totals */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Tax and Totals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tax Rate */}
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.taxRate}
                    onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                {/* Summary */}
                <div className="space-y-2">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formData.currency} {formData.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({formData.taxRate}%):</span>
                      <span>{formData.currency} {formData.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-1">
                      <span>Total:</span>
                      <span>{formData.currency} {formData.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          {availablePaymentMethods.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availablePaymentMethods.map((method) => (
                    <label key={method.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.paymentMethodIds.includes(method.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange('paymentMethodIds', [...formData.paymentMethodIds, method.id]);
                          } else {
                            handleInputChange('paymentMethodIds', formData.paymentMethodIds.filter(id => id !== method.id));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{method.name} ({method.type})</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes for the invoice"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingInvoice ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingInvoice ? 'Update Invoice' : 'Create Invoice'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditInvoiceDialogEnhanced;