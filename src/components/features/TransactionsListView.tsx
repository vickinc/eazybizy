import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateForDisplay } from '@/utils';
import { Transaction, BankAccount, DigitalWallet, BookkeepingEntry } from '@/types';

// Enhanced transaction interface with embedded data
interface EnhancedTransaction extends Transaction {
  account?: BankAccount | DigitalWallet;
  linkedEntry?: BookkeepingEntry;
}
import { 
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Folder,
  CheckSquare,
  Square,
  Link,
  CreditCard,
  Wallet
} from "lucide-react";

interface TransactionsListViewProps {
  groupedTransactions: Array<{ key: string; name: string; transactions: EnhancedTransaction[] }>;
  groupedView: boolean;
  expandedGroups: Set<string>;
  expandedTransactions: Set<string>;
  selectedTransactions: Set<string>;
  toggleGroupExpansion: (groupKey: string) => void;
  toggleTransactionExpansion: (transactionId: string) => void;
  toggleTransactionSelection: (transactionId: string) => void;
  formatCurrency: (amount: number, currency?: string) => string;
  onLinkTransaction: (transactionId: string) => void;
  onUnlinkTransaction: (transactionId: string) => void;
}

export const TransactionsListView: React.FC<TransactionsListViewProps> = ({
  groupedTransactions,
  groupedView,
  expandedGroups,
  expandedTransactions,
  selectedTransactions,
  toggleGroupExpansion,
  toggleTransactionExpansion,
  toggleTransactionSelection,
  formatCurrency,
  onLinkTransaction,
  onUnlinkTransaction
}) => {
  return (
    <div className="space-y-2">
      {groupedTransactions.map(({ key, name, transactions: groupTransactions }) => (
        <div key={key} className="border rounded-lg">
          {/* Group Header */}
          {groupedView && (
            <div 
              className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleGroupExpansion(key)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-6 w-6 pointer-events-none"
                  >
                    {expandedGroups.has(key) ? 
                      <FolderOpen className="h-4 w-4" /> : 
                      <Folder className="h-4 w-4" />
                    }
                  </Button>
                  <h3 className="font-semibold text-lg">{name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {groupTransactions.length} {groupTransactions.length === 1 ? 'transaction' : 'transactions'}
                  </Badge>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${
                  expandedGroups.has(key) ? 'rotate-180' : ''
                }`} />
              </div>
            </div>
          )}
          
          {/* Group Content */}
          {(!groupedView || expandedGroups.has(key)) && (
            <div className="border-t p-2 space-y-2">
              {groupTransactions.map((transaction) => {
                const isExpanded = expandedTransactions.has(transaction.id);
                const account = transaction.companyAccount;
                
                return (
                  <div key={transaction.id} className={`border-l-4 ${transaction.netAmount >= 0 ? 'border-l-green-500' : 'border-l-red-500'} border-r border-t border-b border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200`} id={`transaction-${transaction.id}`}>
                    <div className="p-3">
                      {/* Date in top left corner */}
                      <div className="text-xs text-gray-500 mb-2">
                        {formatDateForDisplay(transaction.date)}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Left side */}
                        <div className="flex-1 flex items-start gap-3">
                          <div className="flex flex-col items-center gap-2 pt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTransactionSelection(transaction.id);
                              }}
                              className="p-1 h-6 w-6"
                            >
                              {selectedTransactions.has(transaction.id) ? (
                                <CheckSquare className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Square className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTransactionExpansion(transaction.id)}
                              className="p-1 h-6 w-6"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <div className={`p-1.5 rounded-full ${transaction.netAmount >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                {transaction.netAmount >= 0 ? 
                                  <ArrowUpCircle className="h-4 w-4 text-green-600" /> :
                                  <ArrowDownCircle className="h-4 w-4 text-red-600" />
                                }
                              </div>
                              {account && (
                                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                  {transaction.accountType === 'bank' ? <CreditCard className="h-3 w-3" /> : <Wallet className="h-3 w-3" />}
                                  <span>
                                    {transaction.accountType === 'bank'
                                      ? (account as BankAccount).accountName
                                      : (account as DigitalWallet).walletName}
                                  </span>
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-base sm:text-lg leading-tight cursor-pointer" onClick={() => toggleTransactionExpansion(transaction.id)}>
                              {transaction.description || `Transaction on ${formatDateForDisplay(transaction.date)}`}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              <span className="font-medium">{transaction.paidBy}</span> to <span className="font-medium">{transaction.paidTo}</span>
                              {transaction.category && <span> • {transaction.category}</span>}
                            </p>
                          </div>
                        </div>

                        {/* Right side */}
                        <div className="w-full sm:w-auto flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center pl-10 sm:pl-0">
                          <div className={`font-bold text-lg sm:text-xl mb-0 sm:mb-2 ${transaction.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(transaction.netAmount, transaction.currency)}
                          </div>
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onLinkTransaction(transaction.id);
                                    }}
                                    className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                  >
                                    <Link className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Link to Bookkeeping Entry</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                    </div>
                  
                    {isExpanded && (
                      <div className="border-t bg-gray-50/50 p-4 space-y-4 mt-2">
                        {/* Full Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div><span className="font-semibold">Paid By:</span> {transaction.paidBy}</div>
                          <div><span className="font-semibold">Paid To:</span> {transaction.paidTo}</div>
                          <div><span className="font-semibold">Date:</span> {formatDateForDisplay(transaction.date)}</div>
                          <div><span className="font-semibold">Reference:</span> {transaction.reference || 'N/A'}</div>
                          <div><span className="font-semibold">Category:</span> {transaction.category || 'N/A'}</div>
                          <div>
                            <span className="font-semibold">Account:</span>
                            {account ? ` ${transaction.accountType === 'bank' ? (account as BankAccount).bankName : (account as DigitalWallet).walletType} - ${transaction.accountType === 'bank' ? (account as BankAccount).accountName : (account as DigitalWallet).walletName}` : 'N/A'}
                          </div>
                        </div>
                        {transaction.notes && (
                          <div>
                            <p className="font-semibold text-sm">Notes:</p>
                            <p className="text-sm bg-white p-2 rounded border">{transaction.notes}</p>
                          </div>
                        )}
                        <div className="border-t pt-2">
                          {transaction.linkedEntryId ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">Linked Entry:</span>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {transaction.linkedEntry?.description || 'Unknown Entry'}
                              </Badge>
                              <Button variant="outline" size="sm" onClick={() => onUnlinkTransaction(transaction.id)}>Unlink</Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">This transaction is not linked to a bookkeeping entry.</span>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => onLinkTransaction(transaction.id)}
                              >
                                <Link className="h-3 w-3 mr-1" />
                                Link Now
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};