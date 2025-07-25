import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Eye from "lucide-react/dist/esm/icons/eye";
import Edit from "lucide-react/dist/esm/icons/edit";
import Archive from "lucide-react/dist/esm/icons/archive";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Send from "lucide-react/dist/esm/icons/send";
import Download from "lucide-react/dist/esm/icons/download";
import Copy from "lucide-react/dist/esm/icons/copy";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import HelpCircle from "lucide-react/dist/esm/icons/help-circle";

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  fromCompanyId: number;
  formattedTotalAmount: string;
  formattedTaxAmount: string;
  formattedCreatedAt?: string;
  formattedIssueDate: string;
  formattedDueDate: string;
  formattedPaidDate?: string;
  formattedUpdatedAt?: string;
  status: string;
  statusConfig: {
    label: string;
    color: string;
    bgColor: string;
  };
  isOverdue: boolean;
  daysOverdue: number;
  daysToDue: number;
  companyInfo?: {
    tradingName: string;
    logo: string;
  };
  paymentMethodNames: string[];
  items: Array<{
    productName: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    total: number;
    currency: string;
  }>;
  notes?: string;
}

interface InvoiceListItemProps {
  invoice: InvoiceItem;
  isExpanded: boolean;
  isSelected: boolean;
  viewMode: string;
  onRowClick: (id: string, e: React.MouseEvent) => void;
  onSelectionToggle: (id: string, checked: boolean) => void;
  onPreview: (invoice: InvoiceItem) => void;
  onEdit: (invoice: InvoiceItem) => void;
  onDownloadPDF: (invoice: InvoiceItem) => void;
  onDuplicate: (id: string) => void;
  onMarkAsSent: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  isMarkingAsSent?: boolean;
  isMarkingAsPaid?: boolean;
}

export const InvoiceListItem: React.FC<InvoiceListItemProps> = ({
  invoice,
  isExpanded,
  isSelected,
  viewMode,
  onRowClick,
  onSelectionToggle,
  onPreview,
  onEdit,
  onDownloadPDF,
  onDuplicate,
  onMarkAsSent,
  onMarkAsPaid,
  onArchive,
  onRestore,
  onDelete,
  isMarkingAsSent = false,
  isMarkingAsPaid = false,
}) => {

  return (
    <div className="border rounded-lg hover:bg-gray-50 transition-all duration-200">
      {/* Always visible header */}
      <div 
        className="p-2 cursor-pointer"
        onClick={(e) => onRowClick(invoice.id, e)}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div className="flex items-center flex-wrap gap-2 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelectionToggle(invoice.id, e.target.checked)}
              className="rounded"
            />
            
            {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            
            {(() => {
              // Show appropriate date based on status
              if (invoice.status === 'PAID' && invoice.formattedPaidDate) {
                return <span className="text-xs text-gray-500">Paid: {invoice.formattedPaidDate}</span>;
              } else if (invoice.status === 'SENT' && invoice.formattedUpdatedAt) {
                return <span className="text-xs text-gray-500">Sent: {invoice.formattedUpdatedAt}</span>;
              } else if (invoice.status === 'OVERDUE' && invoice.formattedUpdatedAt) {
                return <span className="text-xs text-gray-500">Sent: {invoice.formattedUpdatedAt}</span>;
              } else if (invoice.formattedCreatedAt) {
                return <span className="text-xs text-gray-500">Created: {invoice.formattedCreatedAt}</span>;
              }
              return null;
            })()}
            
            {invoice.companyInfo && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs md:text-sm">
                <div className={`w-3 h-3 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
                  invoice.companyInfo.logo && (invoice.companyInfo.logo.startsWith('data:') || invoice.companyInfo.logo.includes('http') || invoice.companyInfo.logo.startsWith('/'))
                    ? '' 
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}>
                  {invoice.companyInfo.logo && (invoice.companyInfo.logo.startsWith('data:') || invoice.companyInfo.logo.includes('http') || invoice.companyInfo.logo.startsWith('/')) ? (
                    <img 
                      src={invoice.companyInfo.logo} 
                      alt={`${invoice.companyInfo.tradingName} logo`} 
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    invoice.companyInfo.tradingName.charAt(0).toUpperCase()
                  )}
                </div>
                {invoice.companyInfo.tradingName}
              </Badge>
            )}
            
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">{invoice.invoiceNumber}</h3>
            <span className="text-sm text-gray-600">{invoice.clientName}</span>
            <span className="font-medium text-green-600">{invoice.formattedTotalAmount}</span>
          </div>
          
          <div className="flex items-center flex-wrap justify-start md:justify-end gap-2">
            <Badge className={`text-xs md:text-sm ${invoice.statusConfig.color} ${invoice.statusConfig.bgColor}`}>
              {invoice.statusConfig.label}
            </Badge>
            
            {viewMode === 'active' && (
              <span className="text-xs text-gray-500">Due: {invoice.formattedDueDate}</span>
            )}
            
            {invoice.isOverdue && (
              <Badge variant="destructive" className="text-xs">
                {invoice.daysOverdue} days overdue
              </Badge>
            )}
            
            {/* Status Action Buttons */}
            {viewMode === 'active' && invoice.status !== 'ARCHIVED' && (
              <>
                {invoice.status === 'DRAFT' && (
                  <Button 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); onMarkAsSent(invoice.id); }}
                    disabled={isMarkingAsSent}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isMarkingAsSent ? (
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <Send className="h-3 w-3" />
                        <span>Mark as Sent</span>
                      </div>
                    )}
                  </Button>
                )}
                
                {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
                  <div
                    onClick={(e) => { e.stopPropagation(); onMarkAsPaid(invoice.id); }}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer border border-lime-200 text-gray-800 ${
                      isMarkingAsPaid ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'
                    }`}
                    style={{ 
                      backgroundColor: '#ecfccb'
                    }}
                    onMouseEnter={(e) => {
                      if (!isMarkingAsPaid) {
                        e.currentTarget.style.backgroundColor = '#d9f99d';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isMarkingAsPaid) {
                        e.currentTarget.style.backgroundColor = '#ecfccb';
                      }
                    }}
                  >
                    {isMarkingAsPaid ? (
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Mark as Paid</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Action buttons */}
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onPreview(invoice); }} className="h-8 px-2">
                <Eye className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDownloadPDF(invoice); }} className="h-8 px-2">
                <Download className="h-3 w-3" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {viewMode === 'active' && invoice.status !== 'ARCHIVED' && (
                    <>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(invoice); }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(invoice.id); }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      {invoice.status === 'DRAFT' && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkAsSent(invoice.id); }}>
                          <Send className="h-4 w-4 mr-2" />
                          Mark as Sent
                        </DropdownMenuItem>
                      )}
                      {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkAsPaid(invoice.id); }}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Paid
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(invoice.id); }}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {viewMode === 'paid' && (
                    <>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(invoice.id); }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(invoice.id); }}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {viewMode === 'archived' && (
                    <>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRestore(invoice.id); }}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(invoice.id); }} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Permanently
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      
      {/* Expandable content */}
      {isExpanded && (
        <div className="px-2 pb-2 border-t bg-gray-50/30">
          <div className="pt-2 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Client</div>
                <div className="font-semibold text-sm">{invoice.clientName}</div>
                <div className="text-xs text-gray-500">{invoice.clientEmail}</div>
              </div>
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Amount</div>
                <div className="font-semibold text-sm">{invoice.formattedTotalAmount}</div>
                <div className="text-xs text-gray-500">Tax: {invoice.formattedTaxAmount}</div>
              </div>
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Dates</div>
                {invoice.formattedCreatedAt && (
                  <div className="text-sm">Created: {invoice.formattedCreatedAt}</div>
                )}
                <div className="text-sm">
                  {(invoice.status === 'SENT' || invoice.status === 'OVERDUE' || invoice.status === 'PAID') ? 'Sent' : 'Issued'}: {(invoice.status === 'SENT' || invoice.status === 'OVERDUE' || invoice.status === 'PAID') && invoice.formattedUpdatedAt ? invoice.formattedUpdatedAt : invoice.formattedIssueDate}
                </div>
                {viewMode === 'active' && (
                  <div className="text-sm">Due: {invoice.formattedDueDate}</div>
                )}
                {invoice.formattedPaidDate && (
                  <div className="text-sm text-green-600">Paid: {invoice.formattedPaidDate}</div>
                )}
              </div>
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Payment Methods</div>
                <div className="text-sm">
                  {invoice.paymentMethodNames.length > 0 
                    ? invoice.paymentMethodNames.join(', ')
                    : 'No payment methods'
                  }
                </div>
              </div>
            </div>
            
            {/* Items */}
            <div className="p-2 bg-white rounded border">
              <div className="font-medium text-gray-600 text-xs mb-1">Items</div>
              <div className="space-y-1">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, itemIndex) => (
                    <div key={`invoice-item-${invoice.id}-${itemIndex}`} className="flex justify-between text-sm">
                      <span>{item.productName} × {item.quantity}</span>
                      <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency }).format(item.total)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No items found</div>
                )}
              </div>
            </div>
            
            {invoice.notes && (
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-gray-600 text-xs mb-0.5">Notes</div>
                <div className="text-sm text-gray-600">{invoice.notes}</div>
              </div>
            )}
            
            <div className="flex justify-between text-xs text-gray-500 pt-1 border-t">
              <span>Status: {invoice.statusConfig.label}</span>
              {invoice.daysToDue > 0 && (
                <span>{invoice.daysToDue} days until due</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};