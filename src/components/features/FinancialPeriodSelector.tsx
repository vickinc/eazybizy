import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarIcon, 
  InfoIcon, 
  GitCompare,
  TrendingUpIcon,
  AlertCircleIcon
} from 'lucide-react';
import { useFinancialPeriods } from '@/hooks/useFinancialPeriods';
import { FinancialPeriod, PeriodType } from '@/types/financialPeriods.types';
import { StatementPeriod, PeriodComparison } from '@/types/financialStatements.types';

interface FinancialPeriodSelectorProps {
  selectedPeriod: StatementPeriod | null;
  priorPeriod?: StatementPeriod | null;
  onPeriodChange: (period: StatementPeriod) => void;
  onPriorPeriodChange?: (period: StatementPeriod | null) => void;
  showComparatives: boolean;
  onShowComparativesChange: (show: boolean) => void;
  statementType: 'BalanceSheet' | 'ProfitLoss' | 'CashFlow';
  className?: string;
}

export const FinancialPeriodSelector: React.FC<FinancialPeriodSelectorProps> = ({
  selectedPeriod,
  priorPeriod,
  onPeriodChange,
  onPriorPeriodChange,
  showComparatives,
  onShowComparativesChange,
  statementType,
  className = ''
}) => {
  const { periods, fiscalYears } = useFinancialPeriods();

  // Convert FinancialPeriod to StatementPeriod
  const convertToStatementPeriod = (period: FinancialPeriod): StatementPeriod => ({
    id: period.id,
    name: period.name,
    startDate: period.startDate,
    endDate: period.endDate,
    fiscalYear: period.fiscalYear,
    periodType: period.periodType,
    isClosed: period.isClosed
  });

  // Group periods by fiscal year for better organization
  const groupedPeriods = useMemo(() => {
    const grouped: { [year: number]: FinancialPeriod[] } = {};
    periods.forEach(period => {
      if (!grouped[period.fiscalYear]) {
        grouped[period.fiscalYear] = [];
      }
      grouped[period.fiscalYear].push(period);
    });

    // Sort periods within each year by start date
    Object.keys(grouped).forEach(year => {
      grouped[parseInt(year)].sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    });

    return grouped;
  }, [periods]);

  // Get available prior periods based on selected period
  const availablePriorPeriods = useMemo(() => {
    if (!selectedPeriod) return [];
    
    const currentYear = selectedPeriod.fiscalYear;
    const currentPeriodType = selectedPeriod.periodType;
    
    // For annual reports, get previous annual periods
    if (currentPeriodType === 'Annual') {
      return periods
        .filter(p => 
          p.periodType === 'Annual' && 
          p.fiscalYear < currentYear
        )
        .sort((a, b) => b.fiscalYear - a.fiscalYear)
        .slice(0, 3); // Last 3 years
    }

    // For quarterly/monthly, get same period from previous years
    return periods
      .filter(p => 
        p.periodType === currentPeriodType && 
        p.fiscalYear < currentYear &&
        p.name.includes(selectedPeriod.name.split(' ')[0]) // Match Q1, Q2, etc.
      )
      .sort((a, b) => b.fiscalYear - a.fiscalYear)
      .slice(0, 2); // Last 2 comparable periods
  }, [selectedPeriod, periods]);

  // Automatically suggest prior period
  const suggestedPriorPeriod = useMemo(() => {
    if (!selectedPeriod || availablePriorPeriods.length === 0) return null;
    return availablePriorPeriods[0];
  }, [selectedPeriod, availablePriorPeriods]);

  // Period comparison analysis
  const periodComparison = useMemo((): PeriodComparison | null => {
    if (!selectedPeriod || !priorPeriod) return null;

    const isComparable = 
      selectedPeriod.periodType === priorPeriod.periodType &&
      selectedPeriod.fiscalYear > priorPeriod.fiscalYear;

    return {
      current: selectedPeriod,
      prior: priorPeriod,
      variance: selectedPeriod.fiscalYear > priorPeriod.fiscalYear ? 'increase' : 'decrease',
      isComparable,
      comparabilityNotes: isComparable ? [] : [
        'Periods are not directly comparable due to different period types or fiscal years'
      ]
    };
  }, [selectedPeriod, priorPeriod]);

  const handlePeriodSelection = (periodId: string) => {
    const period = periods.find(p => p.id === periodId);
    if (period) {
      const statementPeriod = convertToStatementPeriod(period);
      onPeriodChange(statementPeriod);

      // Auto-suggest prior period if comparatives are enabled
      if (showComparatives && suggestedPriorPeriod && onPriorPeriodChange) {
        const priorStatementPeriod = convertToStatementPeriod(suggestedPriorPeriod);
        onPriorPeriodChange(priorStatementPeriod);
      }
    }
  };

  const handlePriorPeriodSelection = (periodId: string) => {
    if (!onPriorPeriodChange) return;
    
    if (periodId === 'none') {
      onPriorPeriodChange(null);
      return;
    }

    const period = periods.find(p => p.id === periodId);
    if (period) {
      const statementPeriod = convertToStatementPeriod(period);
      onPriorPeriodChange(statementPeriod);
    }
  };

  const getStatementTypeDescription = () => {
    switch (statementType) {
      case 'BalanceSheet':
        return 'Select reporting period for Statement of Financial Position';
      case 'ProfitLoss':
        return 'Select reporting period for Statement of Profit or Loss';
      case 'CashFlow':
        return 'Select reporting period for Statement of Cash Flows';
      default:
        return 'Select reporting period for financial statement';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5" />
          <span>Period Selection</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {getStatementTypeDescription()}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Period Selection */}
        <div className="space-y-3">
          <Label htmlFor="currentPeriod" className="text-sm font-medium">
            Reporting Period *
          </Label>
          <Select 
            value={selectedPeriod?.id || ''} 
            onValueChange={handlePeriodSelection}
          >
            <SelectTrigger id="currentPeriod">
              <SelectValue placeholder="Select reporting period" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(groupedPeriods)
                .sort(([a], [b]) => parseInt(b) - parseInt(a))
                .map(([year, yearPeriods]) => (
                  <React.Fragment key={year}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                      Fiscal Year {year}
                    </div>
                    {yearPeriods.map(period => (
                      <SelectItem key={period.id} value={period.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{period.name}</span>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>
                              {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                            </span>
                            <Badge variant={period.isClosed ? 'default' : 'secondary'} className="text-xs">
                              {period.isClosed ? 'Closed' : 'Open'}
                            </Badge>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </React.Fragment>
                ))
              }
            </SelectContent>
          </Select>

          {selectedPeriod && (
            <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-md">
              <InfoIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Selected Period: {selectedPeriod.name}</p>
                <p>
                  {new Date(selectedPeriod.startDate).toLocaleDateString()} - {new Date(selectedPeriod.endDate).toLocaleDateString()}
                </p>
                <p>
                  Status: {selectedPeriod.isClosed ? 'Closed' : 'Open'} | 
                  Type: {selectedPeriod.periodType}
                </p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Comparative Period Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Show Comparative Figures</Label>
              <p className="text-xs text-muted-foreground">
                Include prior period for comparison (IFRS requirement)
              </p>
            </div>
            <Switch
              checked={showComparatives}
              onCheckedChange={onShowComparativesChange}
            />
          </div>

          {showComparatives && (
            <div className="space-y-3">
              <Label htmlFor="priorPeriod" className="text-sm font-medium">
                Comparative Period
              </Label>
              <Select 
                value={priorPeriod?.id || 'none'} 
                onValueChange={handlePriorPeriodSelection}
                disabled={!selectedPeriod || availablePriorPeriods.length === 0}
              >
                <SelectTrigger id="priorPeriod">
                  <SelectValue placeholder="Select comparative period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No comparative period</span>
                  </SelectItem>
                  {availablePriorPeriods.map(period => (
                    <SelectItem key={period.id} value={period.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{period.name}</span>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>
                            {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                          </span>
                          {period.id === suggestedPriorPeriod?.id && (
                            <Badge variant="outline" className="text-xs">
                              Suggested
                            </Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedPeriod && availablePriorPeriods.length === 0 && (
                <div className="flex items-start space-x-2 p-3 bg-amber-50 rounded-md">
                  <AlertCircleIcon className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium">No Comparable Periods Available</p>
                    <p>
                      Create prior year periods to enable comparative reporting.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Period Comparison Summary */}
        {periodComparison && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <GitCompare className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Period Comparison</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Current Period:</p>
                  <p className="font-medium">{periodComparison.current.name}</p>
                  <p className="text-xs text-muted-foreground">FY {periodComparison.current.fiscalYear}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Prior Period:</p>
                  <p className="font-medium">{periodComparison.prior?.name}</p>
                  <p className="text-xs text-muted-foreground">FY {periodComparison.prior?.fiscalYear}</p>
                </div>
              </div>

              {periodComparison.isComparable ? (
                <div className="flex items-start space-x-2 p-3 bg-green-50 rounded-md">
                  <TrendingUpIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-700">
                    <p className="font-medium">Periods are Comparable</p>
                    <p>
                      Both periods have the same type and timeframe for meaningful comparison.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-2 p-3 bg-amber-50 rounded-md">
                  <AlertCircleIcon className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium">Limited Comparability</p>
                    {periodComparison.comparabilityNotes?.map((note, index) => (
                      <p key={index}>{note}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Quick Actions */}
        {selectedPeriod && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (suggestedPriorPeriod && onPriorPeriodChange) {
                    onShowComparativesChange(true);
                    const priorStatementPeriod = convertToStatementPeriod(suggestedPriorPeriod);
                    onPriorPeriodChange(priorStatementPeriod);
                  }
                }}
                disabled={!suggestedPriorPeriod || showComparatives}
              >
                <GitCompare className="h-3 w-3 mr-1" />
                Auto-Compare
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  onShowComparativesChange(false);
                  if (onPriorPeriodChange) {
                    onPriorPeriodChange(null);
                  }
                }}
                disabled={!showComparatives}
              >
                Current Only
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};