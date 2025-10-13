"use client";

import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Database, Check } from "lucide-react";
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
    currencies: ['ETH', 'USDC', 'USDT']
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
  },
  'base': {
    name: 'Base',
    icon: '🔵',
    currencies: ['ETH', 'USDT', 'USDC']
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
    <Card className={`bg-lime-50 shadow-sm border border-gray-200 ${className}`}>
      <div className="p-4 sm:p-5">
        {/* Compact Header with inline progress */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-lime-100 rounded">
              <Database className="h-4 w-4 text-lime-700" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Transaction Filters</h3>
              <p className="text-xs text-gray-500">Configure blockchain filters</p>
            </div>
          </div>
          
          {/* Compact progress steps */}
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((step) => (
              <button
                key={step}
                onClick={() => step < currentStep ? goToStep(step as WizardStep) : null}
                disabled={step > currentStep || (step === currentStep && currentStep === 4)}
                className={`relative group bg-transparent border-0 p-0 ${step < currentStep ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div 
                  className={`px-2.5 py-1 rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                    step === currentStep 
                      ? 'bg-lime-600 text-white ring-2 ring-lime-400' 
                      : step < currentStep
                        ? 'bg-lime-500 text-white hover:bg-lime-600'
                        : 'bg-lime-200 text-lime-700'
                  }`}
                >
                  {step < currentStep ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    step
                  )}
                </div>
                {/* Step label on hover */}
                {step < currentStep && (
                  <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-gray-600 whitespace-nowrap">
                      {step === 1 ? 'Chain' : step === 2 ? 'Tokens' : step === 3 ? 'Period' : 'Summary'}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Step Content - reduced min height */}
        <div className="min-h-[200px] mb-4">
          {renderStepContent()}
        </div>

        {/* Compact Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={resetWizard} 
              className="text-gray-500 hover:text-gray-700 px-2 py-1.5"
            >
              Reset
            </Button>
            
            {/* Compact step indicator */}
            <span className="text-xs text-gray-500">
              {currentStep}/4
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {currentStep > 1 && currentStep < 4 && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousStep}
                className="flex items-center space-x-1 px-3 py-1.5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </Button>
            )}
            
            {currentStep < 4 && (
              <Button
                size="sm"
                onClick={goToNextStep}
                disabled={!canProceedToNext}
                className="flex items-center space-x-1 px-3 py-1.5"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};