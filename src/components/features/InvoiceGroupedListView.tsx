import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import FolderOpen from "lucide-react/dist/esm/icons/folder-open";
import { Invoice } from '@/services/api/invoicesApiService.enhanced';
import { InvoiceListItem } from './InvoiceListItem';

interface InvoiceGroupedListViewProps {
  groupedInvoices: Array<{ key: string; name: string; invoices: Invoice[] }>;
  expandedGroups: Set<string>;
  expandedInvoices: Set<string>;
  selectedInvoices: Set<string>;
  viewMode: 'active' | 'archived';
  sortField: string;
  sortDirection: 'asc' | 'desc';
  searchTerm: string;
  filterStatus: string;
  filterClient: string;
  globalSelectedCompany: number | 'all';
  onInvoiceRowClick: (invoice: Invoice) => void;
  onInvoiceSelectionToggle: (id: string) => void;
  onSelectAllInvoices: () => void;
  onDeselectAllInvoices: () => void;
  isAllInvoicesSelected: boolean;
  onPreviewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDownloadPDF: (invoice: Invoice) => void;
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
  toggleGroupExpansion: (groupKey: string) => void;
  markingSentInvoiceId?: string;
  markingPaidInvoiceId?: string;
}

export const InvoiceGroupedListView: React.FC<InvoiceGroupedListViewProps> = ({
  groupedInvoices,
  expandedGroups,
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
  toggleGroupExpansion,
  markingSentInvoiceId,
  markingPaidInvoiceId
}) => {
  if (groupedInvoices.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No invoices found</h3>
          <p className="text-gray-500">Try adjusting your filters or search terms.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groupedInvoices.map((group) => {
        const isExpanded = expandedGroups.has(group.key);
        
        return (
          <Card key={group.key}>
            <CardContent className="p-0">
              {/* Group Header */}
              <div className="border-b bg-gray-50">
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto text-left font-medium"
                  onClick={() => toggleGroupExpansion(group.key)}
                >
                  <div className="flex items-center space-x-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <FolderOpen className="h-4 w-4 text-blue-500" />
                    <span>{group.name}</span>
                    <span className="text-sm text-gray-500">
                      ({group.invoices.length} invoice{group.invoices.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                </Button>
              </div>

              {/* Group Content */}
              {isExpanded && (
                <div className="divide-y">
                  {group.invoices.map((invoice) => (
                    <InvoiceListItem
                      key={invoice.id}
                      invoice={invoice}
                      isExpanded={expandedInvoices.has(invoice.id)}
                      isSelected={selectedInvoices.has(invoice.id)}
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
                      isMarkingAsSent={markingSentInvoiceId === invoice.id}
                      isMarkingAsPaid={markingPaidInvoiceId === invoice.id}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};