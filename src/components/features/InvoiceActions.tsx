import React from "react";
import { Button } from "@/components/ui/button";
import Plus from "lucide-react/dist/esm/icons/plus";
import Minimize2 from "lucide-react/dist/esm/icons/minimize-2";
import Maximize2 from "lucide-react/dist/esm/icons/maximize-2";
import FileText from "lucide-react/dist/esm/icons/file-text";

interface InvoiceActionsProps {
  onCreateInvoice: () => void;
  filteredInvoicesCount: number;
  isAllExpanded: boolean;
  onToggleAllExpansion: () => void;
  viewMode: string;
  onViewModeChange: (mode: string) => void;
  allInvoices: unknown[];
  canAddInvoice: boolean;
}

export const InvoiceActions: React.FC<InvoiceActionsProps> = ({
  onCreateInvoice,
  filteredInvoicesCount,
  isAllExpanded,
  onToggleAllExpansion,
  viewMode,
  onViewModeChange,
  allInvoices,
  canAddInvoice,
}) => {
  // Calculate actual counts from all invoices
  const activeCounts = allInvoices.filter(inv => inv.status !== 'ARCHIVED' && inv.status !== 'PAID').length;
  const paidCounts = allInvoices.filter(inv => inv.status === 'PAID').length;
  const archivedCounts = allInvoices.filter(inv => inv.status === 'ARCHIVED').length;
  return (
    <div className="mb-6 flex items-center justify-end space-x-2 flex-wrap gap-2">
        {filteredInvoicesCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleAllExpansion}
          >
            {isAllExpanded ? (
              <>
                <Minimize2 className="h-4 w-4 mr-2" />
                Collapse All
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-2" />
                Expand All
              </>
            )}
          </Button>
        )}
        
        <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
          <Button
            variant={viewMode === 'active' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('active')}
            className={viewMode === 'active' ? 'bg-black text-white hover:bg-black' : 'hover:bg-gray-200'}
          >
            Active ({activeCounts})
          </Button>
          <Button
            variant={viewMode === 'paid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('paid')}
            className={viewMode === 'paid' ? 'bg-black text-white hover:bg-black' : 'hover:bg-gray-200'}
          >
            Paid ({paidCounts})
          </Button>
          <Button
            variant={viewMode === 'archived' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('archived')}
            className={viewMode === 'archived' ? 'bg-black text-white hover:bg-black' : 'hover:bg-gray-200'}
          >
            Archived ({archivedCounts})
          </Button>
        </div>
    </div>
  );
};