import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvoiceListItem } from "./InvoiceListItem";
import { Send, CheckCircle, Archive, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface InvoiceListProps {
  filteredInvoices: unknown[];
  expandedInvoices: Set<string>;
  selectedInvoices: Set<string>;
  viewMode: string;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  searchTerm: string;
  filterStatus: string;
  filterClient: string;
  globalSelectedCompany: string;
  onInvoiceRowClick: (id: string, e: React.MouseEvent) => void;
  onInvoiceSelectionToggle: (id: string, checked: boolean) => void;
  onSelectAllInvoices: () => void;
  onDeselectAllInvoices: () => void;
  isAllInvoicesSelected: boolean;
  onPreviewInvoice: (invoice: unknown) => void;
  onEditInvoice: (invoice: unknown) => void;
  onDownloadPDF: (invoice: unknown) => void;
  onDuplicateInvoice: (id: string) => void;
  onMarkAsSent: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
  onArchiveInvoice: (id: string) => void;
  onRestoreInvoice: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onBulkMarkSent: () => void;
  onBulkMarkPaid: () => void;
  onBulkArchive: () => void;
  onBulkDelete: () => void;
  onSort: (field: string) => void;
  onSortFieldChange: (field: string) => void;
  onSortDirectionChange: (direction: 'asc' | 'desc') => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  filteredInvoices,
  expandedInvoices,
  selectedInvoices,
  viewMode,
  sortField,
  sortDirection,
  searchTerm,
  filterStatus,
  filterClient,
  globalSelectedCompany,
  onInvoiceRowClick,
  onInvoiceSelectionToggle,
  onSelectAllInvoices,
  onDeselectAllInvoices,
  isAllInvoicesSelected,
  onPreviewInvoice,
  onEditInvoice,
  onDownloadPDF,
  onDuplicateInvoice,
  onMarkAsSent,
  onMarkAsPaid,
  onArchiveInvoice,
  onRestoreInvoice,
  onDeleteInvoice,
  onBulkMarkSent,
  onBulkMarkPaid,
  onBulkArchive,
  onBulkDelete,
  onSort,
  onSortFieldChange,
  onSortDirectionChange,
}) => {
  return (
    <>
      {/* Bulk Actions */}
      {selectedInvoices.size > 0 && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedInvoices.size} invoice(s) selected
              </span>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={onBulkMarkSent}>
                  <Send className="h-4 w-4 mr-1" />
                  Mark Sent
                </Button>
                <Button size="sm" variant="outline" onClick={onBulkMarkPaid}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark Paid
                </Button>
                <Button size="sm" variant="outline" onClick={onBulkArchive}>
                  <Archive className="h-4 w-4 mr-1" />
                  Archive
                </Button>
                {viewMode === 'archived' && (
                  <Button size="sm" variant="outline" onClick={onBulkDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>
                {viewMode === 'active' ? 'Active Invoices' : 
                 viewMode === 'paid' ? 'Paid Invoices' : 'Archived Invoices'}
              </CardTitle>
              <CardDescription>
                {viewMode === 'active' ? 'Manage your draft, sent, and overdue invoices' : 
                 viewMode === 'paid' ? 'View your completed invoices' : 'View and restore archived invoices'}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              
              <Select value={sortField} onValueChange={onSortFieldChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="sentDate">Sent Date</SelectItem>
                  <SelectItem value="paidDate">Paid Date</SelectItem>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="invoiceNumber">Invoice #</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="currency">Currency</SelectItem>
                  <SelectItem value="paymentMethod">Payment Method</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortDirection} onValueChange={onSortDirectionChange}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">
                    <div className="flex items-center gap-1">
                      <ArrowUp className="h-3 w-3" />
                      Asc
                    </div>
                  </SelectItem>
                  <SelectItem value="desc">
                    <div className="flex items-center gap-1">
                      <ArrowDown className="h-3 w-3" />
                      Desc
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Select All Checkbox */}
          {filteredInvoices.length > 0 && (
            <div className="border rounded-lg mb-2 p-2 bg-gray-50">
              <div className="flex items-center flex-wrap gap-2 flex-1">
                <input
                  type="checkbox"
                  id="select-all-invoices"
                  checked={isAllInvoicesSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSelectAllInvoices();
                    } else {
                      onDeselectAllInvoices();
                    }
                  }}
                  className="rounded"
                />
                <label htmlFor="select-all-invoices" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Select All
                </label>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || filterStatus !== 'all' || filterClient !== 'all' || globalSelectedCompany !== 'all'
                  ? 'No invoices match your filters' 
                  : 'No invoices yet. Create your first invoice!'}
              </div>
            ) : (
              filteredInvoices.map((invoice) => {
                const isExpanded = expandedInvoices.has(invoice.id);
                const isSelected = selectedInvoices.has(invoice.id);
                
                return (
                  <InvoiceListItem
                    key={invoice.id}
                    invoice={invoice}
                    isExpanded={isExpanded}
                    isSelected={isSelected}
                    viewMode={viewMode}
                    onRowClick={onInvoiceRowClick}
                    onSelectionToggle={onInvoiceSelectionToggle}
                    onPreview={onPreviewInvoice}
                    onEdit={onEditInvoice}
                    onDownloadPDF={onDownloadPDF}
                    onDuplicate={onDuplicateInvoice}
                    onMarkAsSent={onMarkAsSent}
                    onMarkAsPaid={onMarkAsPaid}
                    onArchive={onArchiveInvoice}
                    onRestore={onRestoreInvoice}
                    onDelete={onDeleteInvoice}
                  />
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};