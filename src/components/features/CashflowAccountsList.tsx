import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import FolderOpen from "lucide-react/dist/esm/icons/folder-open";
import Folder from "lucide-react/dist/esm/icons/folder";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import { EnhancedGroupedCashflow, EnhancedAccountInfo } from '@/services/business/cashflowBusinessService';

interface CashflowAccountsListProps {
  enhancedGroupedCashflow: EnhancedGroupedCashflow[];
  groupedView: boolean;
  expandedGroups: Set<string>;
  toggleGroupExpansion: (groupKey: string) => void;
}

export const CashflowAccountsList: React.FC<CashflowAccountsListProps> = ({
  enhancedGroupedCashflow,
  groupedView,
  expandedGroups,
  toggleGroupExpansion
}) => {
  const hasAccounts = enhancedGroupedCashflow.some(group => group.accounts.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow by Account</CardTitle>
        <CardDescription>
          Automatic cash flow from transactions and manual entries for all bank accounts and wallets
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasAccounts ? (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No Accounts Found</p>
            <p>Add bank accounts or digital wallets to start tracking cash flow.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {enhancedGroupedCashflow.map(({ key, name, accounts }) => (
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
                          {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
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
                    {accounts.map((account) => {
                      return (
                        <div key={account.id} className="border rounded-lg hover:bg-gray-50 transition-all duration-200">
                          <div className="p-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              {/* Left side */}
                              <div className="flex-1 flex items-start gap-3">
                                <div className={`p-1.5 rounded-full ${account.type === 'bank' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                                  {account.type === 'bank' ? 
                                    <CreditCard className="h-4 w-4 text-blue-600" /> :
                                    <Wallet className="h-4 w-4 text-purple-600" />
                                  }
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      {account.type}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {account.currency}
                                    </Badge>
                                  </div>
                                  <h3 className="font-semibold text-base sm:text-lg leading-tight">
                                    {account.name}
                                  </h3>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {account.company.tradingName}
                                  </p>
                                </div>
                              </div>

                              {/* Right side - Cash Flow Summary */}
                              <div className="w-full sm:w-auto space-y-2">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                  <div>
                                    <div className="text-sm text-gray-500">Inflow</div>
                                    <div className="font-semibold text-green-600">
                                      {account.formattedCashflow.total.inflow}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-500">Outflow</div>
                                    <div className="font-semibold text-red-600">
                                      {account.formattedCashflow.total.outflow}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-500">Net</div>
                                    <div className={`font-bold ${account.cashflow.total.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {account.formattedCashflow.total.net}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Breakdown */}
                                <div className="text-xs text-gray-500 space-y-1">
                                  <div className="flex justify-between">
                                    <span>Automatic:</span>
                                    <span className={account.cashflow.automatic.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      {account.formattedCashflow.automatic.net}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Manual:</span>
                                    <span className={account.cashflow.manual.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      {account.formattedCashflow.manual.net}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};