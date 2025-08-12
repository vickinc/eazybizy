"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { BlockchainIcon } from '@/components/ui/blockchain-icon';
import { BLOCKCHAIN_CURRENCIES, type BlockchainKey } from '../TransactionFilterWizard';
import Check from "lucide-react/dist/esm/icons/check";

export interface BlockchainSelectionStepProps {
  selectedBlockchain: BlockchainKey | null;
  onSelectBlockchain: (blockchain: BlockchainKey) => void;
}

export const BlockchainSelectionStep: React.FC<BlockchainSelectionStepProps> = ({
  selectedBlockchain,
  onSelectBlockchain
}) => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-xl font-semibold text-gray-900 mb-2">Choose Blockchain</h4>
        <p className="text-gray-600">Select which blockchain you want to filter transactions for</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {Object.entries(BLOCKCHAIN_CURRENCIES).map(([key, config]) => {
          const blockchainKey = key as BlockchainKey;
          const isSelected = selectedBlockchain === blockchainKey;
          
          return (
            <Card 
              key={blockchainKey}
              className={`relative p-4 cursor-pointer transition-all border-2 hover:shadow-md ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelectBlockchain(blockchainKey)}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
              
              <div className="flex flex-col items-center space-y-3">
                {/* Blockchain Icon */}
                <div className="w-12 h-12 flex items-center justify-center">
                  <BlockchainIcon 
                    blockchain={blockchainKey} 
                    size={48}
                    className="rounded-lg"
                  />
                </div>
                
                {/* Blockchain Name */}
                <div className="text-center">
                  <h5 className={`font-semibold ${
                    isSelected ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {config.name}
                  </h5>
                  <p className={`text-sm ${
                    isSelected ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {config.currencies.length} currencies
                  </p>
                </div>
                
                {/* Supported Currencies Preview */}
                <div className="flex flex-wrap gap-1 justify-center">
                  {config.currencies.slice(0, 3).map((currency) => (
                    <span
                      key={currency}
                      className={`text-xs px-2 py-1 rounded-full ${
                        isSelected 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {currency}
                    </span>
                  ))}
                  {config.currencies.length > 3 && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        isSelected 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      +{config.currencies.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selection feedback */}
      {selectedBlockchain && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-green-600" />
            <p className="text-green-800 font-medium">
              {BLOCKCHAIN_CURRENCIES[selectedBlockchain].name} blockchain selected
            </p>
          </div>
          <p className="text-green-700 text-sm mt-1">
            You can now choose from {BLOCKCHAIN_CURRENCIES[selectedBlockchain].currencies.length} supported currencies
          </p>
        </div>
      )}
    </div>
  );
};