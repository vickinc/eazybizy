"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BlockchainIcon } from '@/components/ui/blockchain-icon';
import { CryptocurrencyIcon } from '@/components/ui/cryptocurrency-icon';
import { BLOCKCHAIN_CURRENCIES, type WizardState, type WizardStep } from '../TransactionFilterWizard';
import Edit from "lucide-react/dist/esm/icons/edit";
import Filter from "lucide-react/dist/esm/icons/filter";
import Download from "lucide-react/dist/esm/icons/download";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Coins from "lucide-react/dist/esm/icons/coins";
import Database from "lucide-react/dist/esm/icons/database";

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
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-xl font-semibold text-gray-900 mb-2">Review & Apply Filters</h4>
        <p className="text-gray-600">Review your selections and apply the transaction filters</p>
      </div>

      {/* Filter Summary Cards */}
      <div className="space-y-4">
        {/* Blockchain Selection */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h5 className="font-semibold text-gray-900">Blockchain</h5>
                <div className="flex items-center space-x-2 mt-1">
                  <BlockchainIcon blockchain={selectedBlockchain} size={20} />
                  <span className="text-gray-700">{blockchainConfig.name}</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(1)}
              className="flex items-center space-x-1"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          </div>
        </Card>

        {/* Currency Selection */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Coins className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">
                    Currencies ({selectedCurrencies.length})
                  </h5>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {selectedCurrencies.map((currency) => (
                  <div key={currency} className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-1">
                    <CryptocurrencyIcon currency={currency} size={16} />
                    <span className="text-sm font-medium text-gray-700">{currency}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(2)}
              className="flex items-center space-x-1 self-start"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          </div>
        </Card>

        {/* Period Selection */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h5 className="font-semibold text-gray-900">Time Period</h5>
                <p className="text-gray-700">{formatPeriod()}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(3)}
              className="flex items-center space-x-1"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          </div>
        </Card>
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h6 className="font-semibold text-blue-900 mb-2">What happens next?</h6>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span><strong>Apply Filters:</strong> Show live blockchain transactions matching your criteria</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={onApplyFilters}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 px-8"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Filter className="h-4 w-4" />
                <span>Apply Filter</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <Card className="bg-gray-50 p-4">
        <h6 className="font-semibold text-gray-900 mb-2">Filter Summary</h6>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
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