"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BlockchainIcon } from '@/components/ui/blockchain-icon';
import { CryptocurrencyIcon } from '@/components/ui/cryptocurrency-icon';
import { BLOCKCHAIN_CURRENCIES, type WizardState, type WizardStep } from '../TransactionFilterWizard';
import { Edit, Filter, Calendar, Coins, Database } from "lucide-react";

export interface FilterSummaryStepProps {
  wizardState: WizardState;
  onEdit: (step: WizardStep) => void;
  onApplyFilters: () => void;
  isLoading: boolean;
}

export const FilterSummaryStep: React.FC<FilterSummaryStepProps> = ({
  wizardState,
  onEdit,
  onApplyFilters,
  isLoading
}) => {
  const { selectedBlockchain, selectedCurrencies, selectedPeriod, customDateRange } = wizardState;
  
  if (!selectedBlockchain) {
    return null; // Should not happen if wizard validation works
  }

  const blockchainConfig = BLOCKCHAIN_CURRENCIES[selectedBlockchain];
  
  const formatPeriod = () => {
    switch (selectedPeriod) {
      case 'thisMonth':
        return 'This Month';
      case 'lastMonth':
        return 'Last Month';
      case 'thisYear':
        return 'This Year';
      case 'allTime':
        return 'All Time';
      case 'custom':
        return customDateRange 
          ? `${customDateRange.startDate} to ${customDateRange.endDate}`
          : 'Custom Range';
      default:
        return selectedPeriod;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-lg font-semibold text-gray-900">Review & Apply Filters</h4>
        <p className="text-sm text-gray-600 mt-1">Review your selections and apply the transaction filters</p>
      </div>

      {/* Filter Summary Cards */}
      <div className="space-y-3">
        {/* Blockchain Selection */}
        <Card className="p-3 bg-lime-50 border-lime-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-lime-100 rounded">
                <Database className="h-4 w-4 text-lime-700" />
              </div>
              <div>
                <h5 className="text-sm font-semibold text-gray-900">Blockchain</h5>
                <div className="flex items-center space-x-2 mt-0.5">
                  <BlockchainIcon blockchain={selectedBlockchain} className="w-4 h-4" />
                  <span className="text-xs text-gray-700">{blockchainConfig.name}</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(1)}
              className="flex items-center space-x-1 h-7 px-2 text-xs"
            >
              <Edit className="h-3 w-3" />
              <span>Edit</span>
            </Button>
          </div>
        </Card>

        {/* Currency Selection */}
        <Card className="p-3 bg-lime-50 border-lime-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-lime-100 rounded">
                  <Coins className="h-4 w-4 text-lime-700" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-gray-900">
                    Currencies ({selectedCurrencies.length})
                  </h5>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedCurrencies.map((currency) => (
                  <Badge key={currency} className="text-xs bg-white text-lime-700 border-lime-200">
                    <CryptocurrencyIcon currency={currency} className="w-3 h-3 mr-1" />
                    {currency}
                  </Badge>
                ))}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(2)}
              className="flex items-center space-x-1 self-start h-7 px-2 text-xs"
            >
              <Edit className="h-3 w-3" />
              <span>Edit</span>
            </Button>
          </div>
        </Card>

        {/* Period Selection */}
        <Card className="p-3 bg-lime-50 border-lime-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-lime-100 rounded">
                <Calendar className="h-4 w-4 text-lime-700" />
              </div>
              <div>
                <h5 className="text-sm font-semibold text-gray-900">Time Period</h5>
                <p className="text-xs text-gray-700">{formatPeriod()}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(3)}
              className="flex items-center space-x-1 h-7 px-2 text-xs"
            >
              <Edit className="h-3 w-3" />
              <span>Edit</span>
            </Button>
          </div>
        </Card>
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="bg-lime-50 border border-lime-200 rounded-lg p-3">
          <h6 className="text-sm font-semibold text-lime-900 mb-1">What happens next?</h6>
          <div className="text-xs text-lime-800">
            <div className="flex items-start space-x-2">
              <Filter className="h-3.5 w-3.5 mt-0.5" />
              <span>Apply filters to show live blockchain transactions matching your criteria</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={onApplyFilters}
            disabled={isLoading}
            size="sm"
            className="flex items-center justify-center space-x-1.5 px-6"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Filter className="h-3.5 w-3.5" />
                <span>Apply Filter</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <Card className="bg-lime-50 border-lime-200 p-3">
        <h6 className="text-sm font-semibold text-gray-900 mb-2">Filter Summary</h6>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="text-center">
            <p className="text-gray-500">Blockchain</p>
            <p className="font-semibold text-gray-900">{blockchainConfig.name}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Currencies</p>
            <p className="font-semibold text-gray-900">{selectedCurrencies.length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Period</p>
            <p className="font-semibold text-gray-900">
              {selectedPeriod === 'custom' ? 'Custom' : formatPeriod()}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};