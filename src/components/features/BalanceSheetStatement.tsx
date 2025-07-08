import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2Icon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  InfoIcon, 
  AlertTriangleIcon,
  CheckCircleIcon,
  DownloadIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon
} from 'lucide-react';
import { BalanceSheetData, FinancialStatementSection, FinancialStatementItem } from '@/types/financialStatements.types';

interface BalanceSheetStatementProps {
  data: BalanceSheetData;
  showComparatives?: boolean;
  showVariances?: boolean;
  onExport?: (format: 'PDF' | 'Excel') => void;
  className?: string;
}

export const BalanceSheetStatement: React.FC<BalanceSheetStatementProps> = ({
  data,
  showComparatives = true,
  showVariances = true,
  onExport,
  className = ''
}) => {
  
  const renderStatementHeader = () => (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2Icon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.metadata.companyName}</h1>
            <h2 className="text-lg font-semibold text-gray-700">{data.metadata.statementTitle}</h2>
          </div>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="font-medium">Period:</span> {data.metadata.currentPeriod.name}
        </div>
        <div>
          <span className="font-medium">Currency:</span> {data.metadata.functionalCurrency}
        </div>
        <div>
          <span className="font-medium">Prepared:</span> {new Date(data.metadata.preparationDate).toLocaleDateString()}
        </div>
      </div>

      {data.metadata.priorPeriod && (
        <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-md">
          <InfoIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm text-blue-700">
            Comparative figures shown for {data.metadata.priorPeriod.name}
          </span>
        </div>
      )}

      {!data.balanceCheck.isBalanced && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-md border border-red-200">
          <AlertTriangleIcon className="h-4 w-4 text-red-600 flex-shrink-0" />
          <div className="text-sm text-red-700">
            <span className="font-medium">Balance Check Failed:</span> 
            <span className="ml-1">Difference of {data.balanceCheck.formattedDifference}</span>
          </div>
        </div>
      )}

      {data.balanceCheck.isBalanced && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-md border border-green-200">
          <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-700 font-medium">
            Balance Sheet balances correctly
          </span>
        </div>
      )}
    </div>
  );

  const renderTableHeader = () => (
    <div className={`grid ${showComparatives ? 'grid-cols-4' : 'grid-cols-2'} gap-4 pb-3 border-b border-gray-200 font-semibold text-sm text-gray-600`}>
      <div>Account</div>
      <div className="text-right">{data.metadata.currentPeriod.name}</div>
      {showComparatives && data.metadata.priorPeriod && (
        <>
          <div className="text-right">{data.metadata.priorPeriod.name}</div>
          {showVariances && <div className="text-right">Change</div>}
        </>
      )}
    </div>
  );

  const renderVarianceIcon = (variance?: number) => {
    if (!variance || Math.abs(variance) < 0.01) return <MinusIcon className="h-3 w-3 text-gray-400" />;
    if (variance > 0) return <ArrowUpIcon className="h-3 w-3 text-green-600" />;
    return <ArrowDownIcon className="h-3 w-3 text-red-600" />;
  };

  const renderVarianceText = (variance?: number, variancePercent?: number, formattedVariance?: string) => {
    if (!variance || Math.abs(variance) < 0.01) return <span className="text-gray-400">-</span>;
    
    const isPositive = variance > 0;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    const percentText = variancePercent ? ` (${Math.abs(variancePercent).toFixed(1)}%)` : '';
    
    return (
      <span className={colorClass}>
        {formattedVariance}{percentText}
      </span>
    );
  };

  const renderStatementItem = (item: FinancialStatementItem, indent: number = 0) => {
    const paddingClass = indent > 0 ? `pl-${indent * 4}` : '';
    
    return (
      <div 
        key={item.code}
        className={`grid ${showComparatives ? 'grid-cols-4' : 'grid-cols-2'} gap-4 py-2 hover:bg-gray-50 text-sm ${paddingClass}`}
      >
        <div className="flex items-center space-x-2">
          <span className={item.level > 1 ? 'font-semibold' : ''}>{item.name}</span>
          {item.materialityFlag && (
            <Badge variant="outline" className="text-xs">Material</Badge>
          )}
          {item.ifrsReference && (
            <Badge variant="secondary" className="text-xs">{item.ifrsReference}</Badge>
          )}
        </div>
        
        <div className={`text-right ${item.level > 1 ? 'font-semibold' : ''}`}>
          {item.formattedCurrent}
        </div>
        
        {showComparatives && data.metadata.priorPeriod && (
          <>
            <div className="text-right">
              {item.formattedPrior || '-'}
            </div>
            {showVariances && (
              <div className="text-right flex items-center justify-end space-x-2">
                {renderVarianceIcon(item.variance)}
                {renderVarianceText(item.variance, item.variancePercent, item.formattedVariance)}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderStatementSection = (section: FinancialStatementSection, level: number = 1) => (
    <div className="space-y-1">
      {section.items.map(item => renderStatementItem(item, level === 1 ? 1 : 2))}
      
      {/* Section Total */}
      <div className={`grid ${showComparatives ? 'grid-cols-4' : 'grid-cols-2'} gap-4 py-2 border-t border-gray-200 font-semibold text-sm bg-gray-50`}>
        <div className={level === 1 ? 'pl-4' : 'pl-8'}>
          Total {section.name}
        </div>
        <div className="text-right">{section.formattedTotal}</div>
        {showComparatives && data.metadata.priorPeriod && (
          <>
            <div className="text-right">{section.formattedPriorTotal || '-'}</div>
            {showVariances && (
              <div className="text-right flex items-center justify-end space-x-2">
                {renderVarianceIcon(section.variance)}
                {renderVarianceText(section.variance, section.variancePercent, section.formattedVariance)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderGrandTotal = (title: string, totals: any) => (
    <div className={`grid ${showComparatives ? 'grid-cols-4' : 'grid-cols-2'} gap-4 py-3 border-t-2 border-gray-800 font-bold text-base bg-gray-100`}>
      <div>{title}</div>
      <div className="text-right">{totals.formatted}</div>
      {showComparatives && data.metadata.priorPeriod && (
        <>
          <div className="text-right">{totals.formattedPrior || '-'}</div>
          {showVariances && (
            <div className="text-right flex items-center justify-end space-x-2">
              {renderVarianceIcon(totals.variance)}
              {renderVarianceText(totals.variance, totals.variancePercent, totals.formattedVariance)}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader>
        {renderStatementHeader()}
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* ASSETS */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <TrendingUpIcon className="h-5 w-5 text-green-600" />
            <span>ASSETS</span>
          </h3>
          
          {renderTableHeader()}
          
          {/* Current Assets */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800">Current Assets</h4>
            {renderStatementSection(data.assets.currentAssets)}
          </div>
          
          {/* Non-Current Assets */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800">Non-Current Assets</h4>
            {renderStatementSection(data.assets.nonCurrentAssets)}
          </div>
          
          {/* Total Assets */}
          {renderGrandTotal('TOTAL ASSETS', data.assets.totalAssets)}
        </div>

        <Separator />

        {/* LIABILITIES */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <TrendingDownIcon className="h-5 w-5 text-red-600" />
            <span>LIABILITIES</span>
          </h3>
          
          {renderTableHeader()}
          
          {/* Current Liabilities */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800">Current Liabilities</h4>
            {renderStatementSection(data.liabilities.currentLiabilities)}
          </div>
          
          {/* Non-Current Liabilities */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800">Non-Current Liabilities</h4>
            {renderStatementSection(data.liabilities.nonCurrentLiabilities)}
          </div>
          
          {/* Total Liabilities */}
          {renderGrandTotal('TOTAL LIABILITIES', data.liabilities.totalLiabilities)}
        </div>

        <Separator />

        {/* EQUITY */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Building2Icon className="h-5 w-5 text-blue-600" />
            <span>EQUITY</span>
          </h3>
          
          {renderTableHeader()}
          
          {/* Equity Sections */}
          {data.equity.sections.map((section, index) => (
            <div key={index} className="space-y-2">
              <h4 className="font-semibold text-gray-800">{section.name}</h4>
              {renderStatementSection(section)}
            </div>
          ))}
          
          {/* Total Equity */}
          {renderGrandTotal('TOTAL EQUITY', data.equity.totalEquity)}
        </div>

        <Separator />

        {/* TOTAL LIABILITIES AND EQUITY */}
        <div className="space-y-4">
          {renderGrandTotal(
            'TOTAL LIABILITIES AND EQUITY', 
            {
              formatted: data.liabilities.totalLiabilities.formatted,
              formattedPrior: data.liabilities.totalLiabilities.formattedPrior,
              variance: (data.liabilities.totalLiabilities.variance || 0) + (data.equity.totalEquity.variance || 0),
              variancePercent: undefined, // Skip percentage for this total
              formattedVariance: undefined
            }
          )}
        </div>

        {/* Statement Footer */}
        <div className="pt-6 border-t border-gray-200 space-y-3">
          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            {data.metadata.ifrsCompliant && (
              <Badge variant="outline">IFRS Compliant</Badge>
            )}
            {data.metadata.auditStatus && (
              <Badge variant="outline">{data.metadata.auditStatus}</Badge>
            )}
            <Badge variant="outline">
              Rounded to nearest {data.metadata.roundingUnit}
            </Badge>
          </div>
          
          <div className="text-xs text-gray-500">
            <p>
              The accompanying notes are an integral part of these financial statements.
            </p>
            {data.metadata.materialityThreshold && (
              <p>
                Items below {data.metadata.materialityThreshold}% materiality threshold may be aggregated.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};