import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import DollarSignIcon from "lucide-react/dist/esm/icons/dollar-sign";
import TrendingUpIcon from "lucide-react/dist/esm/icons/trending-up";
import TrendingDownIcon from "lucide-react/dist/esm/icons/trending-down";
import InfoIcon from "lucide-react/dist/esm/icons/info";
import AlertTriangleIcon from "lucide-react/dist/esm/icons/alert-triangle";
import CheckCircleIcon from "lucide-react/dist/esm/icons/check-circle";
import DownloadIcon from "lucide-react/dist/esm/icons/download";
import ArrowUpIcon from "lucide-react/dist/esm/icons/arrow-up";
import ArrowDownIcon from "lucide-react/dist/esm/icons/arrow-down";
import MinusIcon from "lucide-react/dist/esm/icons/minus";
import BuildingIcon from "lucide-react/dist/esm/icons/building";
import CreditCardIcon from "lucide-react/dist/esm/icons/credit-card";
import BanknoteIcon from "lucide-react/dist/esm/icons/banknote";
import { CashFlowData, FinancialStatementSection, FinancialStatementItem } from '@/types/financialStatements.types';

interface CashFlowStatementProps {
  data: CashFlowData;
  showComparatives?: boolean;
  showVariances?: boolean;
  onExport?: (format: 'PDF' | 'Excel') => void;
  onToggleMethod?: () => void;
  className?: string;
}

export const CashFlowStatement: React.FC<CashFlowStatementProps> = ({
  data,
  showComparatives = true,
  showVariances = true,
  onExport,
  onToggleMethod,
  className = ''
}) => {
  
  const renderStatementHeader = () => (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <DollarSignIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.metadata.companyName}</h1>
            <h2 className="text-lg font-semibold text-gray-700">{data.metadata.statementTitle}</h2>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {onToggleMethod && (
            <Button variant="outline" size="sm" onClick={onToggleMethod}>
              Switch to {data.method === 'indirect' ? 'Direct' : 'Indirect'}
            </Button>
          )}
          
          {onExport && (
            <>
              <Button variant="outline" size="sm" onClick={() => onExport('PDF')}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport('Excel')}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="font-medium">Period:</span> {data.metadata.currentPeriod.name}
        </div>
        <div>
          <span className="font-medium">Currency:</span> {data.metadata.functionalCurrency}
        </div>
        <div>
          <span className="font-medium">Method:</span> {data.method.charAt(0).toUpperCase() + data.method.slice(1)}
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

      {!data.cashReconciliation.isReconciled && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-md border border-red-200">
          <AlertTriangleIcon className="h-4 w-4 text-red-600 flex-shrink-0" />
          <div className="text-sm text-red-700">
            <span className="font-medium">Cash Reconciliation Failed:</span> 
            <span className="ml-1">Difference of {data.cashReconciliation.formattedDifference}</span>
          </div>
        </div>
      )}

      {data.cashReconciliation.isReconciled && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-md border border-green-200">
          <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-700 font-medium">
            Cash flows reconcile with cash and cash equivalents movement
          </span>
        </div>
      )}
    </div>
  );

  const renderTableHeader = () => (
    <div className={`grid ${showComparatives ? 'grid-cols-4' : 'grid-cols-2'} gap-4 pb-3 border-b border-gray-200 font-semibold text-sm text-gray-600`}>
      <div>Cash Flow</div>
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
        
        <div className={`text-right ${item.level > 1 ? 'font-semibold' : ''} ${item.currentPeriod < 0 ? 'text-red-600' : item.currentPeriod > 0 ? 'text-green-600' : ''}`}>
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
          Net cash {section.name.toLowerCase()}
        </div>
        <div className={`text-right ${section.total < 0 ? 'text-red-600' : section.total > 0 ? 'text-green-600' : ''}`}>
          {section.formattedTotal}
        </div>
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

  const renderNetCashFlow = () => (
    <div className={`grid ${showComparatives ? 'grid-cols-4' : 'grid-cols-2'} gap-4 py-3 border-t-2 border-gray-800 font-bold text-base ${data.netCashFlow.current < 0 ? 'bg-red-50' : data.netCashFlow.current > 0 ? 'bg-green-50' : 'bg-gray-100'}`}>
      <div>NET INCREASE/(DECREASE) IN CASH AND CASH EQUIVALENTS</div>
      <div className={`text-right ${data.netCashFlow.current < 0 ? 'text-red-600' : data.netCashFlow.current > 0 ? 'text-green-600' : ''}`}>
        {data.netCashFlow.formatted}
      </div>
      {showComparatives && data.metadata.priorPeriod && (
        <>
          <div className="text-right">{data.netCashFlow.formattedPrior || '-'}</div>
          {showVariances && (
            <div className="text-right flex items-center justify-end space-x-2">
              {renderVarianceIcon(data.netCashFlow.variance)}
              {renderVarianceText(data.netCashFlow.variance, data.netCashFlow.variancePercent, data.netCashFlow.formattedVariance)}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderCashReconciliation = () => (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-800">Cash and Cash Equivalents Reconciliation</h4>
      
      <div className={`grid ${showComparatives ? 'grid-cols-4' : 'grid-cols-2'} gap-4 py-2 text-sm`}>
        <div>Cash and cash equivalents at beginning of period</div>
        <div className="text-right">{data.cashReconciliation.formattedOpeningCash}</div>
        {showComparatives && data.metadata.priorPeriod && (
          <>
            <div className="text-right">-</div>
            <div className="text-right">-</div>
          </>
        )}
      </div>

      <div className={`grid ${showComparatives ? 'grid-cols-4' : 'grid-cols-2'} gap-4 py-2 text-sm`}>
        <div>Net increase/(decrease) in cash and cash equivalents</div>
        <div className={`text-right ${data.netCashFlow.current < 0 ? 'text-red-600' : data.netCashFlow.current > 0 ? 'text-green-600' : ''}`}>
          {data.netCashFlow.formatted}
        </div>
        {showComparatives && data.metadata.priorPeriod && (
          <>
            <div className="text-right">{data.netCashFlow.formattedPrior || '-'}</div>
            <div className="text-right">-</div>
          </>
        )}
      </div>

      <div className={`grid ${showComparatives ? 'grid-cols-4' : 'grid-cols-2'} gap-4 py-2 border-t border-gray-200 font-semibold text-sm bg-gray-50`}>
        <div>Cash and cash equivalents at end of period</div>
        <div className="text-right">{data.cashReconciliation.formattedClosingCash}</div>
        {showComparatives && data.metadata.priorPeriod && (
          <>
            <div className="text-right">-</div>
            <div className="text-right">-</div>
          </>
        )}
      </div>
    </div>
  );

  const renderSupplementaryDisclosures = () => {
    if (!data.supplementaryDisclosures || data.supplementaryDisclosures.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-800">Supplementary Disclosures</h4>
        
        {renderTableHeader()}
        {data.supplementaryDisclosures.map(item => renderStatementItem(item))}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        {renderStatementHeader()}
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* OPERATING ACTIVITIES */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <BanknoteIcon className="h-5 w-5 text-green-600" />
            <span>CASH FLOWS FROM OPERATING ACTIVITIES</span>
          </h3>
          
          {renderTableHeader()}
          {renderStatementSection(data.operatingActivities)}
        </div>

        <Separator />

        {/* INVESTING ACTIVITIES */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <BuildingIcon className="h-5 w-5 text-blue-600" />
            <span>CASH FLOWS FROM INVESTING ACTIVITIES</span>
          </h3>
          
          {renderTableHeader()}
          {renderStatementSection(data.investingActivities)}
        </div>

        <Separator />

        {/* FINANCING ACTIVITIES */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <CreditCardIcon className="h-5 w-5 text-purple-600" />
            <span>CASH FLOWS FROM FINANCING ACTIVITIES</span>
          </h3>
          
          {renderTableHeader()}
          {renderStatementSection(data.financingActivities)}
        </div>

        <Separator />

        {/* NET CASH FLOW */}
        {renderNetCashFlow()}

        <Separator />

        {/* CASH RECONCILIATION */}
        {renderCashReconciliation()}

        {/* SUPPLEMENTARY DISCLOSURES */}
        {data.supplementaryDisclosures && data.supplementaryDisclosures.length > 0 && (
          <>
            <Separator />
            {renderSupplementaryDisclosures()}
          </>
        )}

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
              {data.method.charAt(0).toUpperCase() + data.method.slice(1)} Method
            </Badge>
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
            <p>
              Cash and cash equivalents comprise cash on hand and demand deposits, and other short-term highly liquid investments that are readily convertible to a known amount of cash and are subject to an insignificant risk of changes in value.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};