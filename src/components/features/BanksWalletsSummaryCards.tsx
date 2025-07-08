import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Banknote,
  CheckCircle,
  Wallet
} from "lucide-react";
import { BanksWalletsSummary } from '@/services/business/banksWalletsBusinessService';

interface BanksWalletsSummaryCardsProps {
  summary: BanksWalletsSummary;
}

export const BanksWalletsSummaryCards: React.FC<BanksWalletsSummaryCardsProps> = ({
  summary
}) => {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Banknote className="h-4 w-4 mr-2" />
                  Total Bank Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalBankAccounts}</div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total number of bank accounts across all companies</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Active Banks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.activeBankAccounts}</div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Number of bank accounts currently active and operational</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Wallet className="h-4 w-4 mr-2" />
                  Digital Wallets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalDigitalWallets}</div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total number of digital wallets (PayPal, Stripe, Crypto, etc.)</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Active Wallets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.activeDigitalWallets}</div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Number of digital wallets currently active and operational</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};