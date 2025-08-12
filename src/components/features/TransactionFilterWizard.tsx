"use client";

import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Database from "lucide-react/dist/esm/icons/database";
import { BlockchainSelectionStep } from './wizard/BlockchainSelectionStep';
import { CurrencySelectionStep } from './wizard/CurrencySelectionStep';
import { PeriodSelectionStep } from './wizard/PeriodSelectionStep';
import { FilterSummaryStep } from './wizard/FilterSummaryStep';

// Blockchain and currency mappings
export const BLOCKCHAIN_CURRENCIES = {
  'tron': {
    name: 'Tron',
    icon: '🟢',
    currencies: ['TRX', 'USDT', 'USDC']
  },
  'ethereum': {
    name: 'Ethereum', 
    icon: '🔷',
    currencies: ['ETH', 'USDT', 'USDC', 'DAI', 'WETH']
  },
  'bitcoin': {
    name: 'Bitcoin',
    icon: '🟠', 
    currencies: ['BTC']
  },
  'binance-smart-chain': {
    name: 'BSC',
    icon: '🟡',
    currencies: ['BNB', 'USDT', 'USDC', 'BUSD']
  },
  'solana': {
    name: 'Solana',
    icon: '🟣',
    currencies: ['SOL', 'USDT', 'USDC']
  }
} as const;

export type BlockchainKey = keyof typeof BLOCKCHAIN_CURRENCIES;
export type WizardStep = 1 | 2 | 3 | 4;

export interface WizardState {
  selectedBlockchain: BlockchainKey | null;
  selectedCurrencies: string[];
  selectedPeriod: string;
  customDateRange: {
    startDate: string;
    endDate: string;
  } | null;
}

export interface TransactionFilterWizardProps {
  onApplyFilters: (state: WizardState) => void;
  isLoading?: boolean;
  className?: string;
}

export const TransactionFilterWizard: React.FC<TransactionFilterWizardProps> = ({
  onApplyFilters,
  isLoading = false,
  className = ""
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [wizardState, setWizardState] = useState<WizardState>({
    selectedBlockchain: null,
    selectedCurrencies: [],
    selectedPeriod: 'thisMonth',
    customDateRange: null
  });

  // Update wizard state
  const updateWizardState = useCallback((updates: Partial<WizardState>) => {
    setWizardState(prev => ({ ...prev, ...updates }));
  }, []);

  // Step navigation
  const goToStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
  }, []);

  const goToNextStep = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  }, [currentStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  }, [currentStep]);

  // Step validation
  const isStepValid = useCallback((step: WizardStep): boolean => {
    switch (step) {
      case 1:
        return wizardState.selectedBlockchain !== null;
      case 2:
        return wizardState.selectedCurrencies.length > 0;
      case 3:
        return wizardState.selectedPeriod !== '';
      case 4:
        return true; // Summary step is always valid if we reach it
      default:
        return false;
    }
  }, [wizardState]);

  const canProceedToNext = isStepValid(currentStep);

  // Reset wizard
  const resetWizard = useCallback(() => {
    setCurrentStep(1);
    setWizardState({
      selectedBlockchain: null,
      selectedCurrencies: [],
      selectedPeriod: 'thisMonth',
      customDateRange: null
    });
  }, []);

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BlockchainSelectionStep
            selectedBlockchain={wizardState.selectedBlockchain}
            onSelectBlockchain={(blockchain) => {
              updateWizardState({ 
                selectedBlockchain: blockchain,
                selectedCurrencies: [] // Reset currencies when blockchain changes
              });
            }}
          />
        );
      case 2:
        return (
          <CurrencySelectionStep
            blockchain={wizardState.selectedBlockchain!}
            selectedCurrencies={wizardState.selectedCurrencies}
            onUpdateCurrencies={(currencies) => {
              updateWizardState({ selectedCurrencies: currencies });
            }}
          />
        );
      case 3:
        return (
          <PeriodSelectionStep
            selectedPeriod={wizardState.selectedPeriod}
            customDateRange={wizardState.customDateRange}
            onUpdatePeriod={(period, dateRange) => {
              updateWizardState({ 
                selectedPeriod: period,
                customDateRange: dateRange
              });
            }}
          />
        );
      case 4:
        return (
          <FilterSummaryStep
            wizardState={wizardState}
            onEdit={goToStep}
            onApplyFilters={() => onApplyFilters(wizardState)}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card className={`bg-white shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Transaction Filters</h3>
              <p className="text-sm text-gray-500">Step-by-step blockchain transaction filtering</p>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step === currentStep 
                      ? 'bg-blue-600 text-white' 
                      : step < currentStep
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <ChevronRight className={`h-4 w-4 mx-1 ${
                    step < currentStep ? 'text-green-600' : 'text-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            {currentStep > 1 && currentStep < 4 && (
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                className="flex items-center space-x-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
            )}
            
            {currentStep < 4 && (
              <Button
                onClick={goToNextStep}
                disabled={!canProceedToNext}
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={resetWizard} className="text-gray-600">
              Reset
            </Button>
            
            {/* Step indicators as text */}
            <Badge variant="outline" className="text-xs">
              Step {currentStep} of 4
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};