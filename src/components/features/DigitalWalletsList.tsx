import React from 'react';
import { formatDateForDisplay } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2
} from "lucide-react";
import { EnhancedDigitalWallet } from '@/services/business/banksWalletsBusinessService';

interface DigitalWalletsListProps {
  filteredDigitalWallets: EnhancedDigitalWallet[];
  noDataMessage: string;
  expandedWallets: Set<string>;
  toggleWalletExpansion: (walletId: string) => void;
  handleToggleWalletStatus: (walletId: string) => void;
  handleDeleteDigitalWallet: (walletId: string) => void;
  setEditingWallet: (wallet: any) => void;
  isAllWalletsExpanded: boolean;
  toggleAllWalletsExpansion: () => void;
}

export const DigitalWalletsList: React.FC<DigitalWalletsListProps> = ({
  filteredDigitalWallets,
  noDataMessage,
  expandedWallets,
  toggleWalletExpansion,
  handleToggleWalletStatus,
  handleDeleteDigitalWallet,
  setEditingWallet,
  isAllWalletsExpanded,
  toggleAllWalletsExpansion
}) => {

  const renderCurrencyBadges = (wallet: EnhancedDigitalWallet) => {
    if (wallet.walletType.toLowerCase() === 'crypto' && wallet.currencies) {
      // Handle currencies as a string (comma-separated from database)
      const currenciesArray = typeof wallet.currencies === 'string' 
        ? wallet.currencies.split(', ').filter(c => c.trim())
        : wallet.currencies;
        
      if (currenciesArray.length > 0) {
        return (
          <div className="flex flex-wrap gap-1">
            {currenciesArray.slice(0, 2).map(currency => (
              <Badge key={currency} variant="outline" className="text-xs">
                {currency.trim()}
              </Badge>
            ))}
            {currenciesArray.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{currenciesArray.length - 2}
              </Badge>
            )}
          </div>
        );
      }
    }
    return <Badge variant="outline" className="text-sm">{wallet.currency}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Digital Wallets</CardTitle>
            <CardDescription>Manage digital wallets and payment methods</CardDescription>
          </div>
          {filteredDigitalWallets.length > 0 && (
            <Button 
              variant="outline"
              size="sm"
              onClick={toggleAllWalletsExpansion}
              className="flex items-center space-x-2"
            >
              {isAllWalletsExpanded ? (
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
          {filteredDigitalWallets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {noDataMessage}
            </div>
          ) : (
            filteredDigitalWallets.map((wallet) => {
              const isExpanded = expandedWallets.has(wallet.id);
              
              return (
                <div key={wallet.id} className="border rounded-lg hover:bg-gray-50 transition-all duration-200">
                  {/* Always visible header */}
                  <div 
                    className="p-2 cursor-pointer"
                    onClick={() => toggleWalletExpansion(wallet.id)}
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
                        
                        <Badge variant="outline" className="flex items-center gap-1 text-sm">
                          <div className={`w-3 h-3 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
                            wallet.company.logo && (wallet.company.logo.startsWith('data:') || wallet.company.logo.includes('http') || wallet.company.logo.startsWith('/'))
                              ? '' 
                              : 'bg-gradient-to-br from-blue-500 to-purple-600'
                          }`}>
                            {wallet.company.logo && (wallet.company.logo.startsWith('data:') || wallet.company.logo.includes('http') || wallet.company.logo.startsWith('/')) ? (
                              <img 
                                src={wallet.company.logo} 
                                alt={`${wallet.company.tradingName} logo`} 
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              wallet.company.tradingName?.charAt(0) || 'W'
                            )}
                          </div>
                          {wallet.company.tradingName}
                        </Badge>
                        
                        <h3 className="font-semibold text-gray-900 text-base">{wallet.walletName}</h3>
                        <Badge variant="outline" className="text-sm">{wallet.walletType}</Badge>
                        
                        {/* Display multiple currencies for crypto wallets */}
                        {renderCurrencyBadges(wallet)}
                      </div>
                      
                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Badge className={`text-sm ${wallet.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {wallet.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleToggleWalletStatus(wallet.id)}
                          className="h-7 px-2 text-xs"
                        >
                          {wallet.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingWallet(wallet)} className="h-7 w-7 p-1">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteDigitalWallet(wallet.id)} className="h-7 w-7 p-1">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expandable content */}
                  {isExpanded && (
                    <div className="px-2 pb-2 border-t bg-gray-50/30">
                      <div className="pt-2 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div className="p-2 bg-white rounded border">
                            <div className="font-medium text-gray-600 text-xs mb-0.5">Company</div>
                            <div className="font-semibold text-sm">{wallet.company.tradingName}</div>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="font-medium text-gray-600 text-xs mb-0.5">Address</div>
                            <div className="font-semibold text-sm">{wallet.walletAddress}</div>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="font-medium text-gray-600 text-xs mb-0.5">Description</div>
                            <div className="font-semibold text-sm">{wallet.description}</div>
                          </div>
                        </div>
                        
                        {wallet.blockchain && (
                          <div className="p-2 bg-white rounded border">
                            <div className="font-medium text-gray-600 text-xs mb-0.5">Blockchain</div>
                            <div className="text-sm text-gray-600">{wallet.blockchain}</div>
                          </div>
                        )}
                        
                        {/* Show all currencies for crypto wallets */}
                        {wallet.walletType.toLowerCase() === 'crypto' && wallet.currencies && (
                          (() => {
                            const currenciesArray = typeof wallet.currencies === 'string' 
                              ? wallet.currencies.split(', ').filter(c => c.trim())
                              : wallet.currencies;
                            
                            return currenciesArray.length > 0 && (
                              <div className="p-2 bg-white rounded border">
                                <div className="font-medium text-gray-600 text-xs mb-0.5">Supported Currencies</div>
                                <div className="flex flex-wrap gap-1">
                                  {currenciesArray.map(currency => (
                                    <Badge key={currency} variant="outline" className="text-xs">
                                      {currency.trim()}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            );
                          })()
                        )}
                        
                        <div className="flex justify-between text-xs text-gray-500 pt-1 border-t">
                          <span>Created: {formatDateForDisplay(wallet.createdAt.split('T')[0])}</span>
                          <span>Type: {wallet.walletType}</span>
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