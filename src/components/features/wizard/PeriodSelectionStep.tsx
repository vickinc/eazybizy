"use client";

import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, CalendarDays, CalendarRange, Infinity, Check, Circle } from "lucide-react";

export interface PeriodSelectionStepProps {
  selectedPeriod: string;
  customDateRange: {
    startDate: string;
    endDate: string;
  } | null;
  onUpdatePeriod: (period: string, dateRange?: { startDate: string; endDate: string } | null) => void;
}

interface PeriodOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isCustom?: boolean;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  {
    id: 'thisMonth',
    name: 'This Month',
    description: 'Current month transactions',
    icon: <Calendar className="h-6 w-6" />
  },
  {
    id: 'lastMonth', 
    name: 'Last Month',
    description: 'Previous month transactions',
    icon: <CalendarDays className="h-6 w-6" />
  },
  {
    id: 'thisYear',
    name: 'This Year',
    description: 'Current year transactions',
    icon: <CalendarRange className="h-6 w-6" />
  },
  {
    id: 'allTime',
    name: 'All Time',
    description: 'All available transactions',
    icon: <Infinity className="h-6 w-6" />
  },
  {
    id: 'custom',
    name: 'Custom Range',
    description: 'Choose specific date range',
    icon: <Clock className="h-6 w-6" />,
    isCustom: true
  }
];

export const PeriodSelectionStep: React.FC<PeriodSelectionStepProps> = ({
  selectedPeriod,
  customDateRange,
  onUpdatePeriod
}) => {
  const [tempStartDate, setTempStartDate] = useState(customDateRange?.startDate || '');
  const [tempEndDate, setTempEndDate] = useState(customDateRange?.endDate || '');

  const selectPeriod = useCallback((periodId: string) => {
    if (periodId === 'custom') {
      onUpdatePeriod(periodId, customDateRange);
    } else {
      onUpdatePeriod(periodId, null);
    }
  }, [onUpdatePeriod, customDateRange]);

  const updateCustomDateRange = useCallback(() => {
    if (tempStartDate && tempEndDate) {
      const dateRange = {
        startDate: tempStartDate,
        endDate: tempEndDate
      };
      onUpdatePeriod('custom', dateRange);
    }
  }, [tempStartDate, tempEndDate, onUpdatePeriod]);

  const isCustomPeriodValid = selectedPeriod === 'custom' && customDateRange?.startDate && customDateRange?.endDate;

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-lg font-semibold text-gray-900">Select Time Period</h4>
        <p className="text-sm text-gray-600 mt-1">Choose the date range for your transaction filter</p>
      </div>

      {/* Period Options */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {PERIOD_OPTIONS.map((option) => {
          const isSelected = selectedPeriod === option.id;
          
          return (
            <button
              key={option.id}
              className={`relative group p-3 rounded-lg border transition-all text-left ${
                isSelected 
                  ? 'border-lime-500 bg-lime-100 ring-2 ring-lime-500 ring-opacity-50' 
                  : 'bg-lime-50 border-lime-200 hover:border-lime-300 hover:bg-lime-100'
              } ${option.isCustom ? 'col-span-2 sm:col-span-1' : ''}`}
              onClick={() => !option.isCustom && selectPeriod(option.id)}
            >
              {/* Radio indicator */}
              {!option.isCustom && (
                <div className="absolute top-2 right-2">
                  {isSelected ? (
                    <div className="w-4 h-4 bg-lime-600 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                  )}
                </div>
              )}
              
              <div className="flex flex-col space-y-2">
                {/* Period Icon and Info */}
                <div className="flex items-start space-x-2">
                  <div className={`p-1.5 rounded ${
                    isSelected 
                      ? 'bg-lime-200 text-lime-700' 
                      : 'bg-lime-100 text-lime-600'
                  }`}>
                    {React.cloneElement(option.icon as React.ReactElement, { className: 'h-4 w-4' })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className={`font-medium text-sm ${
                      isSelected ? 'text-lime-900' : 'text-gray-900'
                    }`}>
                      {option.name}
                    </h5>
                    <p className={`text-xs ${
                      isSelected ? 'text-lime-700' : 'text-gray-500'
                    }`}>
                      {option.description}
                    </p>
                  </div>
                </div>

                {/* Custom Date Range Inputs */}
                {option.isCustom && (
                  <div className="w-full space-y-2 mt-2">
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <Label htmlFor="startDate" className="text-xs text-gray-600">Start</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={tempStartDate}
                          onChange={(e) => setTempStartDate(e.target.value)}
                          className="h-8 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate" className="text-xs text-gray-600">End</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={tempEndDate}
                          onChange={(e) => setTempEndDate(e.target.value)}
                          className="h-8 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (tempStartDate && tempEndDate) {
                          updateCustomDateRange();
                        }
                      }}
                      className={`w-full h-7 text-xs rounded-md px-2 py-1 text-center cursor-pointer transition-colors ${
                        !tempStartDate || !tempEndDate
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-lime-600 text-white hover:bg-lime-700'
                      }`}
                    >
                      Apply
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Period Summary */}
      <div className="p-3 bg-lime-50 border border-lime-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-lime-600" />
          <span className="text-sm font-medium text-lime-900">Selected period:</span>
          <span className="text-sm font-semibold text-lime-900">
            {PERIOD_OPTIONS.find(opt => opt.id === selectedPeriod)?.name}
          </span>
        </div>
        
        {selectedPeriod === 'custom' && customDateRange && (
          <div className="mt-1 text-xs text-lime-700">
            From {customDateRange.startDate} to {customDateRange.endDate}
          </div>
        )}

        {selectedPeriod === 'custom' && !isCustomPeriodValid && (
          <div className="mt-1 text-xs text-amber-600">
            Please select both start and end dates for custom range
          </div>
        )}
      </div>
    </div>
  );
};