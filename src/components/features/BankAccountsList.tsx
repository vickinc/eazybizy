import React from 'react';
import { formatDateForDisplay } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Edit from "lucide-react/dist/esm/icons/edit";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import Maximize2 from "lucide-react/dist/esm/icons/maximize-2";
import Minimize2 from "lucide-react/dist/esm/icons/minimize-2";
import { EnhancedBankAccount } from '@/services/business/banksWalletsBusinessService';
import { BlockchainIcon } from '@/components/ui/blockchain-icon';

interface BankAccountsListProps {
  filteredBankAccounts: EnhancedBankAccount[];
  noDataMessage: string;
  expandedBanks: Set<string>;
  toggleBankExpansion: (bankId: string) => void;
  handleToggleBankStatus: (accountId: string) => void;
  handleDeleteBankAccount: (accountId: string) => void;
  setEditingBank: (bank: unknown) => void;
  isAllBanksExpanded: boolean;
  toggleAllBanksExpansion: () => void;
}

export const BankAccountsList: React.FC<BankAccountsListProps> = ({
  filteredBankAccounts,
  noDataMessage,
  expandedBanks,
  toggleBankExpansion,
  handleToggleBankStatus,
  handleDeleteBankAccount,
  setEditingBank,
  isAllBanksExpanded,
  toggleAllBanksExpansion
}) => {

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bank Accounts</CardTitle>
            <CardDescription>Manage bank accounts for your companies</CardDescription>
          </div>
          {filteredBankAccounts.length > 0 && (
            <Button 
              variant="outline"
              size="sm"
              onClick={toggleAllBanksExpansion}
              className="flex items-center space-x-2"
            >
              {isAllBanksExpanded ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  <span>Collapse All</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  <span>Expand All</span>
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {filteredBankAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {noDataMessage}
            </div>
          ) : (
            filteredBankAccounts.map((bank) => {
              const isExpanded = expandedBanks.has(bank.id);
              
              return (
                <div key={bank.id} className="border rounded-lg hover:bg-gray-50 transition-all duration-200">
                  {/* Always visible header */}
                  <div 
                    className="p-2 cursor-pointer"
                    onClick={() => toggleBankExpansion(bank.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-6 w-6 pointer-events-none"
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                        
                        {/* Add blockchain icon for crypto-related accounts */}
                        {bank.blockchain && (
                          <div className="p-1 bg-lime-100 rounded-lg">
                            <BlockchainIcon blockchain={bank.blockchain} className="h-4 w-4" />
                          </div>
                        )}
                        
                        <Badge variant="outline" className="flex items-center gap-1 text-sm">
                          <div className={`w-3 h-3 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
                            bank.company.logo && (bank.company.logo.startsWith('data:') || bank.company.logo.includes('http') || bank.company.logo.startsWith('/'))
                              ? '' 
                              : 'bg-gradient-to-br from-blue-500 to-purple-600'
                          }`}>
                            {bank.company.logo && (bank.company.logo.startsWith('data:') || bank.company.logo.includes('http') || bank.company.logo.startsWith('/')) ? (
                              <img 
                                src={bank.company.logo} 
                                alt={`${bank.company.tradingName} logo`} 
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              bank.company.tradingName?.charAt(0) || 'B'
                            )}
                          </div>
                          {bank.company.tradingName}
                        </Badge>
                        
                        <h3 className="font-semibold text-gray-900 text-base">{bank.bankName}</h3>
                        <Badge variant="outline" className="text-sm">{bank.currency}</Badge>
                      </div>
                      
                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Badge className={`text-sm ${bank.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {bank.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleToggleBankStatus(bank.id)}
                          className="h-7 px-2 text-xs"
                        >
                          {bank.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingBank(bank)} className="h-7 w-7 p-1">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteBankAccount(bank.id)} className="h-7 w-7 p-1">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expandable content */}
                  {isExpanded && (
                    <div className="px-2 pb-2 border-t bg-gray-50/30">
                      <div className="pt-2 space-y-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div className="p-2 bg-white rounded border">
                            <div className="font-medium text-gray-600 text-xs mb-0.5">Company</div>
                            <div className="font-semibold text-sm">{bank.company.tradingName}</div>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="font-medium text-gray-600 text-xs mb-0.5">Account Name</div>
                            <div className="font-semibold text-sm">{bank.accountName}</div>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="font-medium text-gray-600 text-xs mb-0.5">IBAN</div>
                            <div className="font-semibold text-sm">{bank.iban}</div>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="font-medium text-gray-600 text-xs mb-0.5">SWIFT</div>
                            <div className="font-semibold text-sm">{bank.swiftCode}</div>
                          </div>
                        </div>
                        
                        {bank.bankAddress && (
                          <div className="p-2 bg-white rounded border">
                            <div className="font-medium text-gray-600 text-xs mb-0.5">Address</div>
                            <div className="text-sm text-gray-600">{bank.bankAddress}</div>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-xs text-gray-500 pt-1 border-t">
                          <span>Created: {formatDateForDisplay(bank.createdAt.split('T')[0])}</span>
                          <span>Currency: {bank.currency}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};