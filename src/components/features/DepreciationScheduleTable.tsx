import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Calculator from "lucide-react/dist/esm/icons/calculator";
import TrendingDown from "lucide-react/dist/esm/icons/trending-down";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import {
  FixedAsset,
  DepreciationScheduleEntry
} from '@/types/fixedAssets.types';

interface DepreciationScheduleTableProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  asset: FixedAsset | null;
  schedule: DepreciationScheduleEntry[];
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDepreciationMethod = (method: string): string => {
  return method
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const DepreciationScheduleTable: React.FC<DepreciationScheduleTableProps> = ({
  isOpen,
  onOpenChange,
  asset,
  schedule
}) => {
  if (!asset) return null;

  const totalDepreciation = schedule.reduce((sum, entry) => sum + entry.depreciationAmount, 0);
  const finalBookValue = asset.acquisitionCost - totalDepreciation;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Depreciation Schedule - {asset.name}
          </DialogTitle>
          <DialogDescription>
            Asset Code: {asset.code} | Method: {formatDepreciationMethod(asset.depreciationMethod)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Asset Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Acquisition Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(asset.acquisitionCost)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(asset.acquisitionDate)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Total Depreciation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalDepreciation)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Over {asset.usefulLifeYears} years
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Book Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(asset.currentBookValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  As of today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Residual Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(asset.residualValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Final value
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Asset Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Asset Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Category:</span>
                  <p className="text-muted-foreground">{asset.category}</p>
                </div>
                <div>
                  <span className="font-medium">Location:</span>
                  <p className="text-muted-foreground">{asset.location || 'Not specified'}</p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge variant="outline" className="ml-2 capitalize">
                    {asset.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Depreciation Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Depreciation Schedule</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Period Start</TableHead>
                      <TableHead>Period End</TableHead>
                      <TableHead className="text-right">Opening Balance</TableHead>
                      <TableHead className="text-right">Depreciation</TableHead>
                      <TableHead className="text-right">Closing Balance</TableHead>
                      <TableHead className="text-right">Accumulated Depreciation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.map((entry, index) => {
                      const isCurrentPeriod = new Date(entry.periodStart) <= new Date() && 
                                              new Date() <= new Date(entry.periodEnd);
                      
                      return (
                        <TableRow 
                          key={index} 
                          className={isCurrentPeriod ? 'bg-blue-50' : ''}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {entry.period}
                              {isCurrentPeriod && (
                                <Badge variant="default" size="sm">
                                  Current
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(entry.periodStart)}</TableCell>
                          <TableCell>{formatDate(entry.periodEnd)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(entry.openingBalance)}
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            {formatCurrency(entry.depreciationAmount)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(entry.closingBalance)}
                          </TableCell>
                          <TableCell className="text-right text-gray-600">
                            {formatCurrency(entry.accumulatedDepreciation)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Depreciation Details</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <span className="font-medium">{formatDepreciationMethod(asset.depreciationMethod)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Useful Life:</span>
                      <span className="font-medium">{asset.usefulLifeYears} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Start Date:</span>
                      <span className="font-medium">{formatDate(asset.depreciationStartDate)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Financial Summary</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Total Cost:</span>
                      <span className="font-medium">{formatCurrency(asset.acquisitionCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Depreciation:</span>
                      <span className="font-medium text-red-600">{formatCurrency(totalDepreciation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Final Book Value:</span>
                      <span className="font-medium text-green-600">{formatCurrency(finalBookValue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};