"use client";

import React from 'react';
import { BlockchainIcon } from '@/components/ui/blockchain-icon';
import { BLOCKCHAIN_CURRENCIES, type BlockchainKey } from '../TransactionFilterWizard';
import { Check, Circle } from "lucide-react";

export interface BlockchainSelectionStepProps {
  selectedBlockchain: BlockchainKey | null;
  onSelectBlockchain: (blockchain: BlockchainKey) => void;
}

export const BlockchainSelectionStep: React.FC<BlockchainSelectionStepProps> = ({
  selectedBlockchain,
  onSelectBlockchain
}) => {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-lg font-semibold text-gray-900">Select Blockchain</h4>
        <p className="text-sm text-gray-600 mt-1">Choose a blockchain to filter transactions</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {Object.entries(BLOCKCHAIN_CURRENCIES).map(([key, config]) => {
          const blockchainKey = key as BlockchainKey;
          const isSelected = selectedBlockchain === blockchainKey;
          
          return (
            <button
              key={blockchainKey}
              className={`relative group p-3 rounded-lg border transition-all text-left ${
                isSelected 
                  ? 'border-lime-500 bg-lime-100 ring-2 ring-lime-500 ring-opacity-50' 
                  : 'bg-lime-50 border-lime-200 hover:border-lime-300 hover:bg-lime-100'
              }`}
              onClick={() => onSelectBlockchain(blockchainKey)}
            >
              {/* Radio indicator */}
              <div className="absolute top-2 right-2">
                {isSelected ? (
                  <div className="w-4 h-4 bg-lime-600 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                ) : (
                  <Circle className="h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                )}
              </div>
              
              <div className="flex flex-col space-y-2">
                {/* Icon and Name */}
                <div className="flex items-start space-x-2">
                  <BlockchainIcon 
                    blockchain={blockchainKey} 
                    className="w-8 h-8 rounded-md flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className={`font-medium text-sm ${
                      isSelected ? 'text-lime-900' : 'text-gray-900'
                    }`}>
                      {config.name}
                    </h5>
                    <p className={`text-xs ${
                      isSelected ? 'text-lime-700' : 'text-gray-500'
                    }`}>
                      {config.currencies.length} tokens
                    </p>
                  </div>
                </div>
                
                {/* Currency badges - compact display */}
                <div className="flex flex-wrap gap-1">
                  {config.currencies.slice(0, 2).map((currency) => (
                    <span
                      key={currency}
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        isSelected 
                          ? 'bg-lime-200 text-lime-800' 
                          : 'bg-white text-lime-700 border border-lime-200'
                      }`}
                    >
                      {currency}
                    </span>
                  ))}
                  {config.currencies.length > 2 && (
                    <span
                      className={`relative group/tooltip text-xs px-1.5 py-0.5 rounded cursor-help ${
                        isSelected 
                          ? 'text-lime-700' 
                          : 'text-lime-600'
                      }`}
                    >
                      +{config.currencies.length - 2}
                      {/* Tooltip showing remaining currencies */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                          {config.currencies.slice(2).join(', ')}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Compact selection feedback */}
      {selectedBlockchain && (
        <div className="flex items-center justify-between p-3 bg-lime-50 border border-lime-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-lime-600" />
            <span className="text-sm font-medium text-lime-900">
              {BLOCKCHAIN_CURRENCIES[selectedBlockchain].name} selected
            </span>
            <span className="text-sm text-lime-700">
              • {BLOCKCHAIN_CURRENCIES[selectedBlockchain].currencies.length} currencies available
            </span>
          </div>
        </div>
      )}
    </div>
  );
};