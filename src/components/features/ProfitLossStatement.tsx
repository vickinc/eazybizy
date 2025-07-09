import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Separator } from '@/components/ui/separator';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUpIcon,
  TrendingDownIcon,
  InfoIcon,
  DownloadIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  CalculatorIcon
} from "lucide-react";
import { PLData } from '@/services/business/profitLossBusinessService';
import { ProfitLossData, FinancialStatementSection, FinancialStatementItem } from '@/types/financialStatements.types';

interface ProfitLossStatementProps {
  data?: ProfitLossData; // New IFRS-compliant data structure
  plData?: PLData; // Legacy data structure for backward compatibility
  periodName?: string;
  formatCurrency?: (amount: number) => string;
  showComparatives?: boolean;
  showVariances?: boolean;
  onExport?: (format: 'PDF' | 'Excel') => void;
  className?: string;
}

export const ProfitLossStatement: React.FC<ProfitLossStatementProps> = ({
  data,
  plData,
  periodName,
  formatCurrency,
  showComparatives = true,
  showVariances = true,
  onExport,
  className = ''
}) => {
  
  // Use new IFRS data structure if available, otherwise fall back to legacy
  const isIFRSFormat = !!data;
  
  if (isIFRSFormat && data) {
    return renderIFRSProfitLoss();
  }
  
  // Legacy rendering for backward compatibility
  return renderLegacyProfitLoss();

  function renderIFRSProfitLoss() {
    if (!data) return null;

    const renderStatementHeader = () => (
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CalculatorIcon className="h-6 w-6 text-green-600" />
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

    const renderCalculatedTotal = (title: string, totals: unknown, colorClass: string = '') => (
      <div className={`grid ${showComparatives ? 'grid-cols-4' : 'grid-cols-2'} gap-4 py-3 border-t-2 border-gray-800 font-bold text-base bg-gray-100 ${colorClass}`}>
        <div>{title}</div>
        <div className="text-right">{totals.formatted}</div>
        {showComparatives && data.metadata.priorPeriod && (
          <>
            <div className="text-right">{totals.formattedPrior || '-'}</div>
            {showVariances && (
              <div className="text-right flex items-center justify-end space-x-2">
                {renderVarianceIcon(totals.variance)}
                {renderVarianceText(totals.variance, totals.variancePercent, totals.formattedVariance)}
                {totals.margin !== undefined && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({totals.margin.toFixed(1)}%)
                  </span>
                )}
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
          {/* REVENUE */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <TrendingUpIcon className="h-5 w-5 text-green-600" />
              <span>REVENUE</span>
            </h3>
            
            {renderTableHeader()}
            {renderStatementSection(data.revenue)}
          </div>

          <Separator />

          {/* COST OF SALES */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <TrendingDownIcon className="h-5 w-5 text-red-600" />
              <span>COST OF SALES</span>
            </h3>
            
            {renderTableHeader()}
            {renderStatementSection(data.costOfSales)}
          </div>

          {/* GROSS PROFIT */}
          {renderCalculatedTotal('GROSS PROFIT', data.grossProfit, 'bg-green-50')}

          <Separator />

          {/* OPERATING EXPENSES */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <TrendingDownIcon className="h-5 w-5 text-red-600" />
              <span>OPERATING EXPENSES</span>
            </h3>
            
            {renderTableHeader()}
            {renderStatementSection(data.operatingExpenses)}
          </div>

          {/* OPERATING PROFIT */}
          {renderCalculatedTotal('OPERATING PROFIT', data.operatingProfit, 'bg-blue-50')}

          <Separator />

          {/* FINANCE INCOME & COSTS */}
          {(data.financeIncome.items.length > 0 || data.financeCosts.items.length > 0) && (
            <>
              {data.financeIncome.items.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <TrendingUpIcon className="h-5 w-5 text-green-600" />
                    <span>FINANCE INCOME</span>
                  </h3>
                  {renderTableHeader()}
                  {renderStatementSection(data.financeIncome)}
                </div>
              )}

              {data.financeCosts.items.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <TrendingDownIcon className="h-5 w-5 text-red-600" />
                    <span>FINANCE COSTS</span>
                  </h3>
                  {renderTableHeader()}
                  {renderStatementSection(data.financeCosts)}
                </div>
              )}

              {/* PROFIT BEFORE TAX */}
              {renderCalculatedTotal('PROFIT BEFORE TAX', data.profitBeforeTax, 'bg-amber-50')}

              <Separator />
            </>
          )}

          {/* TAX EXPENSE */}
          {data.taxExpense.items.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <TrendingDownIcon className="h-5 w-5 text-red-600" />
                <span>TAX EXPENSE</span>
              </h3>
              {renderTableHeader()}
              {renderStatementSection(data.taxExpense)}
            </div>
          )}

          {/* PROFIT FOR THE PERIOD */}
          {renderCalculatedTotal(
            'PROFIT FOR THE PERIOD', 
            data.profitForPeriod, 
            data.profitForPeriod.current >= 0 ? 'bg-green-100' : 'bg-red-100'
          )}

          {/* OTHER COMPREHENSIVE INCOME */}
          {data.otherComprehensiveIncome && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">OTHER COMPREHENSIVE INCOME</h3>
                {renderTableHeader()}
                {renderStatementSection(data.otherComprehensiveIncome)}
              </div>
              
              {data.totalComprehensiveIncome && 
                renderCalculatedTotal('TOTAL COMPREHENSIVE INCOME', data.totalComprehensiveIncome, 'bg-purple-50')
              }
            </>
          )}

          {/* EARNINGS PER SHARE */}
          {data.earningsPerShare && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">EARNINGS PER SHARE</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Basic earnings per share:</span>
                  </div>
                  <div className="text-right">
                    {data.earningsPerShare.formattedBasic}
                    {data.earningsPerShare.formattedPriorBasic && showComparatives && (
                      <span className="text-gray-500 ml-4">
                        (Prior: {data.earningsPerShare.formattedPriorBasic})
                      </span>
                    )}
                  </div>
                  {data.earningsPerShare.diluted && (
                    <>
                      <div>
                        <span className="font-medium">Diluted earnings per share:</span>
                      </div>
                      <div className="text-right">
                        {data.earningsPerShare.formattedDiluted}
                        {data.earningsPerShare.formattedPriorDiluted && showComparatives && (
                          <span className="text-gray-500 ml-4">
                            (Prior: {data.earningsPerShare.formattedPriorDiluted})
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
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
  }

  function renderLegacyProfitLoss() {
    if (!plData || !periodName || !formatCurrency) return null;

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Profit & Loss Statement</span>
            <Badge variant="outline">{periodName}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Revenue Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-green-700 flex items-center">
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Revenue
            </h3>
            {plData.revenue.items.length > 0 ? (
              <>
                {plData.revenue.items.map(item => (
                  <div key={item.category} className="flex justify-between items-center pl-6">
                    <span className="text-sm text-gray-600">{item.category}</span>
                    <span className="font-medium text-green-600">
                      {item.formattedAmount}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center font-semibold pt-2 border-t">
                  <span>Total Revenue</span>
                  <span className="text-green-600">{plData.revenue.formattedTotal}</span>
                </div>
              </>
            ) : (
              <div className="pl-6 text-sm text-gray-500 italic">
                No revenue entries for this period
              </div>
            )}
          </div>

          {/* COGS Section */}
          {plData.cogs.total > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-red-700 flex items-center">
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Cost of Goods Sold
              </h3>
              {plData.cogs.items.map(item => (
                <div key={item.category} className="flex justify-between items-center pl-6">
                  <span className="text-sm text-gray-600">{item.category}</span>
                  <span className="font-medium text-red-600">
                    {item.formattedAmount}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center font-semibold pt-2 border-t">
                <span>Total COGS</span>
                <span className="text-red-600">{plData.cogs.formattedTotal}</span>
              </div>
            </div>
          )}

          {/* Gross Profit */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Gross Profit</span>
              <span className={plData.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                {plData.formattedGrossProfit}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Margin: {plData.grossProfitMargin.toFixed(1)}%
            </div>
          </div>

          {/* Operating Expenses */}
          <div className="space-y-3">
            <h3 className="font-semibold text-red-700 flex items-center">
              <ArrowDownCircle className="h-4 w-4 mr-2" />
              Operating Expenses
            </h3>
            {plData.operatingExpenses.items.length > 0 ? (
              <>
                {plData.operatingExpenses.items.map(item => (
                  <div key={item.category} className="flex justify-between items-center pl-6">
                    <span className="text-sm text-gray-600">{item.category}</span>
                    <span className="font-medium text-red-600">
                      {item.formattedAmount}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center font-semibold pt-2 border-t">
                  <span>Total Operating Expenses</span>
                  <span className="text-red-600">{plData.operatingExpenses.formattedTotal}</span>
                </div>
              </>
            ) : (
              <div className="pl-6 text-sm text-gray-500 italic">
                No operating expenses for this period
              </div>
            )}
          </div>

          {/* Operating Income */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Operating Income</span>
              <span className={plData.operatingIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                {plData.formattedOperatingIncome}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Margin: {plData.operatingMargin.toFixed(1)}%
            </div>
          </div>

          {/* Other Income/Expenses */}
          {(plData.otherIncome.total > 0 || plData.otherExpenses.total > 0) && (
            <>
              {plData.otherIncome.total > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-green-700 flex items-center">
                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                    Other Income
                  </h3>
                  {plData.otherIncome.items.map(item => (
                    <div key={item.category} className="flex justify-between items-center pl-6">
                      <span className="text-sm text-gray-600">{item.category}</span>
                      <span className="font-medium text-green-600">
                        {item.formattedAmount}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center font-semibold pt-2 border-t">
                    <span>Total Other Income</span>
                    <span className="text-green-600">{plData.otherIncome.formattedTotal}</span>
                  </div>
                </div>
              )}

              {plData.otherExpenses.total > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-red-700 flex items-center">
                    <ArrowDownCircle className="h-4 w-4 mr-2" />
                    Other Expenses
                  </h3>
                  {plData.otherExpenses.items.map(item => (
                    <div key={item.category} className="flex justify-between items-center pl-6">
                      <span className="text-sm text-gray-600">{item.category}</span>
                      <span className="font-medium text-red-600">
                        {item.formattedAmount}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center font-semibold pt-2 border-t">
                    <span>Total Other Expenses</span>
                    <span className="text-red-600">{plData.otherExpenses.formattedTotal}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Net Income */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center font-bold text-xl">
              <span>Net Income</span>
              <span className={plData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                {plData.formattedNetIncome}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Net Margin: {plData.netProfitMargin.toFixed(1)}%
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
            <div className="space-y-1">
              <div className="text-gray-600">Total Revenue:</div>
              <div className="font-medium text-green-600">{plData.formattedTotalRevenue}</div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-600">Total Expenses:</div>
              <div className="font-medium text-red-600">{plData.formattedTotalExpenses}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
};