'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  DownloadIcon, 
  AlertCircleIcon, 
  CheckCircleIcon,
  InfoIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from 'lucide-react';
import { EquityChangesData } from '@/types/financialStatements.types';

interface StatementOfChangesInEquityProps {
  data: EquityChangesData;
  showComparatives?: boolean;
  showVariances?: boolean;
  onExport?: (format: 'PDF' | 'Excel') => void;
  className?: string;
}

export const StatementOfChangesInEquity: React.FC<StatementOfChangesInEquityProps> = ({
  data,
  showComparatives = true,
  showVariances = true,
  onExport,
  className = ''
}) => {
  const { metadata, equityComponents, movements, totalEquity, reconciliation, dividendInformation } = data;

  const formatVariance = (variance?: number, variancePercent?: number) => {
    if (variance === undefined || variancePercent === undefined) return null;
    
    const isPositive = variance >= 0;
    const Icon = isPositive ? TrendingUpIcon : TrendingDownIcon;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`flex items-center space-x-1 ${colorClass}`}>
        <Icon className="h-3 w-3" />
        <span className="text-xs">
          {Math.abs(variancePercent).toFixed(1)}%
        </span>
      </div>
    );
  };

  const EquityComponentRow = ({ component, label }: { component: any; label: string }) => (
    <tr className="border-b">
      <td className="py-2 font-medium text-left">{label}</td>
      <td className="py-2 text-right">{component.openingBalanceFormatted}</td>
      <td className="py-2 text-right">{component.totalMovementsFormatted}</td>
      <td className="py-2 text-right">{component.closingBalanceFormatted}</td>
      {showComparatives && (
        <td className="py-2 text-right text-gray-600">
          {component.priorYearClosingFormatted || '-'}
        </td>
      )}
      {showVariances && showComparatives && (
        <td className="py-2 text-right">
          {formatVariance(component.variance, component.variancePercent)}
        </td>
      )}
    </tr>
  );

  const MovementRow = ({ movement, label }: { movement: any; label: string }) => (
    <tr className="border-b border-gray-100">
      <td className="py-2 text-left">{label}</td>
      <td className="py-2 text-right">{movement.shareCapitalFormatted}</td>
      <td className="py-2 text-right">{movement.retainedEarningsFormatted}</td>
      <td className="py-2 text-right">{movement.otherComprehensiveIncomeFormatted}</td>
      <td className="py-2 text-right">{movement.otherReservesFormatted}</td>
      <td className="py-2 text-right font-medium">{movement.totalMovementFormatted}</td>
    </tr>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statement Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-gray-900">
                {metadata.statementTitle}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {metadata.companyName} • For the {metadata.currentPeriod.periodType.toLowerCase()} ended {new Date(metadata.currentPeriod.endDate).toLocaleDateString()}
              </CardDescription>
            </div>
            {onExport && (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => onExport('PDF')}>
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => onExport('Excel')}>
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Statement Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="py-3 text-left font-semibold">Components of Equity</th>
                  <th className="py-3 text-right font-semibold">Opening Balance</th>
                  <th className="py-3 text-right font-semibold">Total Movements</th>
                  <th className="py-3 text-right font-semibold">Closing Balance</th>
                  {showComparatives && (
                    <th className="py-3 text-right font-semibold">Prior Year</th>
                  )}
                  {showVariances && showComparatives && (
                    <th className="py-3 text-right font-semibold">Variance</th>
                  )}
                </tr>
              </thead>
              <tbody>
                <EquityComponentRow 
                  component={equityComponents.shareCapital} 
                  label="Share Capital" 
                />
                <EquityComponentRow 
                  component={equityComponents.shareCapitalReserves} 
                  label="Share Capital Reserves" 
                />
                <EquityComponentRow 
                  component={equityComponents.retainedEarnings} 
                  label="Retained Earnings" 
                />
                <EquityComponentRow 
                  component={equityComponents.otherComprehensiveIncome} 
                  label="Other Comprehensive Income" 
                />
                <EquityComponentRow 
                  component={equityComponents.otherReserves} 
                  label="Other Reserves" 
                />
                
                {/* Total Equity Row */}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <td className="py-3 text-left">Total Equity</td>
                  <td className="py-3 text-right">{totalEquity.openingBalanceFormatted}</td>
                  <td className="py-3 text-right">{totalEquity.totalMovementsFormatted}</td>
                  <td className="py-3 text-right">{totalEquity.closingBalanceFormatted}</td>
                  {showComparatives && (
                    <td className="py-3 text-right">{totalEquity.priorYearClosingFormatted}</td>
                  )}
                  {showVariances && showComparatives && (
                    <td className="py-3 text-right">
                      {formatVariance(totalEquity.variance, totalEquity.variancePercent)}
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Movements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis of Movements in Equity</CardTitle>
          <CardDescription>
            Detailed breakdown of changes in each equity component during the period
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="py-3 text-left font-semibold">Movement</th>
                  <th className="py-3 text-right font-semibold">Share Capital</th>
                  <th className="py-3 text-right font-semibold">Retained Earnings</th>
                  <th className="py-3 text-right font-semibold">OCI</th>
                  <th className="py-3 text-right font-semibold">Other Reserves</th>
                  <th className="py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                <MovementRow 
                  movement={movements.profitForPeriod} 
                  label="Profit for the period" 
                />
                <MovementRow 
                  movement={movements.otherComprehensiveIncome} 
                  label="Other comprehensive income" 
                />
                <MovementRow 
                  movement={movements.totalComprehensiveIncome} 
                  label="Total comprehensive income" 
                />
                <MovementRow 
                  movement={movements.dividendsPaid} 
                  label="Dividends paid" 
                />
                <MovementRow 
                  movement={movements.shareCapitalIssued} 
                  label="Shares issued" 
                />
                <MovementRow 
                  movement={movements.shareBasedPayments} 
                  label="Share-based payments" 
                />
                <MovementRow 
                  movement={movements.transfersToReserves} 
                  label="Transfers to reserves" 
                />
                {movements.priorPeriodAdjustments.totalMovement !== 0 && (
                  <MovementRow 
                    movement={movements.priorPeriodAdjustments} 
                    label="Prior period adjustments" 
                  />
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dividend Information */}
      {dividendInformation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <InfoIcon className="h-5 w-5 mr-2 text-blue-600" />
              Dividend Information
            </CardTitle>
            <CardDescription>
              Details of dividends declared and paid during the period
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Dividends per Share</p>
                <p className="text-lg font-semibold">{dividendInformation.dividendsPerShareFormatted}</p>
              </div>
              {dividendInformation.dividendYield && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Dividend Yield</p>
                  <p className="text-lg font-semibold">{dividendInformation.dividendYield.toFixed(2)}%</p>
                </div>
              )}
              {dividendInformation.dividendCover && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Dividend Cover</p>
                  <p className="text-lg font-semibold">{dividendInformation.dividendCover.toFixed(1)}x</p>
                </div>
              )}
            </div>
            
            {(dividendInformation.interimDividends || dividendInformation.finalDividends) && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dividendInformation.interimDividends && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Interim Dividends</p>
                      <p className="font-medium">${dividendInformation.interimDividends.toLocaleString()}</p>
                    </div>
                  )}
                  {dividendInformation.finalDividends && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Final Dividends</p>
                      <p className="font-medium">${dividendInformation.finalDividends.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reconciliation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            {reconciliation.balanceSheetEquityMatches ? (
              <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
            ) : (
              <AlertCircleIcon className="h-5 w-5 mr-2 text-red-600" />
            )}
            Balance Sheet Reconciliation
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Reconciliation Status</span>
              <Badge variant={reconciliation.balanceSheetEquityMatches ? 'default' : 'destructive'}>
                {reconciliation.balanceSheetEquityMatches ? 'Matched' : 'Not Matched'}
              </Badge>
            </div>
            
            {!reconciliation.balanceSheetEquityMatches && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Difference</span>
                <span className="font-medium text-red-600">{reconciliation.formattedDifference}</span>
              </div>
            )}
            
            {reconciliation.reconciliationNotes && reconciliation.reconciliationNotes.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-sm font-medium text-gray-900 mb-2">Notes:</p>
                <ul className="space-y-1">
                  {reconciliation.reconciliationNotes.map((note, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statement Footer */}
      <div className="text-center text-xs text-gray-500 pt-4 border-t">
        <p>This statement has been prepared in accordance with International Financial Reporting Standards (IFRS)</p>
        <p>Prepared on {new Date(metadata.preparationDate).toLocaleDateString()} • Currency: {metadata.functionalCurrency}</p>
        {metadata.auditStatus && (
          <p className="mt-1">
            <Badge variant="outline" className="text-xs">
              {metadata.auditStatus}
            </Badge>
          </p>
        )}
      </div>
    </div>
  );
};