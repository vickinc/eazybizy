"use client";

import React, { useState, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Clock from "lucide-react/dist/esm/icons/clock";
import CalendarDays from "lucide-react/dist/esm/icons/calendar-days";
import CalendarRange from "lucide-react/dist/esm/icons/calendar-range";
import Infinity from "lucide-react/dist/esm/icons/infinity";
import Check from "lucide-react/dist/esm/icons/check";

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
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-xl font-semibold text-gray-900 mb-2">Select Time Period</h4>
        <p className="text-gray-600">Choose the date range for your transaction filter</p>
      </div>

      {/* Period Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {PERIOD_OPTIONS.map((option) => {
          const isSelected = selectedPeriod === option.id;
          
          return (
            <Card
              key={option.id}
              className={`relative p-4 cursor-pointer transition-all border-2 hover:shadow-md ${
                isSelected 
                  ? 'border-purple-500 bg-purple-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${option.isCustom ? 'sm:col-span-2 lg:col-span-1' : ''}`}
              onClick={() => !option.isCustom && selectPeriod(option.id)}
            >
              {/* Selection indicator */}
              {isSelected && !option.isCustom && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
              
              <div className="flex flex-col items-center space-y-3">
                {/* Period Icon */}
                <div className={`p-3 rounded-lg ${
                  isSelected 
                    ? 'bg-purple-100 text-purple-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {option.icon}
                </div>
                
                {/* Period Info */}
                <div className="text-center">
                  <h5 className={`font-semibold ${
                    isSelected ? 'text-purple-900' : 'text-gray-900'
                  }`}>
                    {option.name}
                  </h5>
                  <p className={`text-sm ${
                    isSelected ? 'text-purple-700' : 'text-gray-500'
                  }`}>
                    {option.description}
                  </p>
                </div>

                {/* Custom Date Range Inputs */}
                {option.isCustom && (
                  <div className="w-full space-y-3 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="startDate" className="text-xs text-gray-600">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={tempStartDate}
                          onChange={(e) => setTempStartDate(e.target.value)}
                          className="mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate" className="text-xs text-gray-600">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={tempEndDate}
                          onChange={(e) => setTempEndDate(e.target.value)}
                          className="mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCustomDateRange();
                      }}
                      disabled={!tempStartDate || !tempEndDate}
                      className="w-full"
                    >
                      Apply Custom Range
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected Period Summary */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-600" />
          <span className="text-gray-700 font-medium">Selected period:</span>
          <span className="text-gray-900 font-semibold">
            {PERIOD_OPTIONS.find(opt => opt.id === selectedPeriod)?.name}
          </span>
        </div>
        
        {selectedPeriod === 'custom' && customDateRange && (
          <div className="mt-2 text-sm text-gray-600">
            From {customDateRange.startDate} to {customDateRange.endDate}
          </div>
        )}

        {selectedPeriod === 'custom' && !isCustomPeriodValid && (
          <div className="mt-2 text-sm text-amber-600">
            Please select both start and end dates for custom range
          </div>
        )}
      </div>
    </div>
  );
};