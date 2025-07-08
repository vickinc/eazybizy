'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  PlayIcon,
  RefreshCwIcon,
  BarChart3Icon,
  FileTextIcon,
  ShieldCheckIcon,
  ClockIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  InfoIcon,
  BugIcon,
  TargetIcon
} from 'lucide-react';
import {
  IntegratedFinancialStatements,
  ValidationResults,
  ValidationWarning,
  ValidationError,
  IntegrationTestSuite,
  IntegrationTestResult,
  FinancialStatementsIntegrationService
} from '@/services/integration/financialStatementsIntegrationService';

interface IntegrationTestingDashboardProps {
  companyId: string;
  statements?: IntegratedFinancialStatements;
  onRunTests?: (statements: IntegratedFinancialStatements) => void;
  onGenerateStatements?: () => Promise<IntegratedFinancialStatements>;
  className?: string;
}

interface ValidationCardProps {
  title: string;
  status: boolean;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

interface TestResultCardProps {
  test: IntegrationTestResult;
}

interface WarningListProps {
  warnings: ValidationWarning[];
}

interface ErrorListProps {
  errors: ValidationError[];
}

/**
 * Validation status card
 */
const ValidationCard: React.FC<ValidationCardProps> = ({ title, status, icon: Icon, description, color }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          {status ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          ) : (
            <XCircleIcon className="h-5 w-5 text-red-500" />
          )}
          <span className={`text-sm font-medium ${status ? 'text-green-700' : 'text-red-700'}`}>
            {status ? 'Passed' : 'Failed'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
};

/**
 * Test result card
 */
const TestResultCard: React.FC<TestResultCardProps> = ({ test }) => {
  const getStatusColor = () => {
    return test.passed ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = () => {
    return test.passed ? (
      <CheckCircleIcon className="h-4 w-4 text-green-500" />
    ) : (
      <XCircleIcon className="h-4 w-4 text-red-500" />
    );
  };

  const formatNumber = (num: number) => {
    return Math.abs(num) >= 1000000 
      ? `${(num / 1000000).toFixed(1)}M`
      : Math.abs(num) >= 1000
      ? `${(num / 1000).toFixed(1)}K`
      : num.toLocaleString();
  };

  return (
    <Card className={`border-l-4 ${test.passed ? 'border-l-green-500' : 'border-l-red-500'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{test.testName}</CardTitle>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <Badge className={`text-xs ${test.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {test.passed ? 'PASS' : 'FAIL'}
            </Badge>
          </div>
        </div>
        <CardDescription>{test.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Actual Value</p>
            <p className="font-medium">{formatNumber(test.actualValue)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Expected Value</p>
            <p className="font-medium">{formatNumber(test.expectedValue)}</p>
          </div>
          {test.variance > 0 && (
            <>
              <div>
                <p className="text-muted-foreground">Variance</p>
                <p className={`font-medium ${getStatusColor()}`}>{formatNumber(test.variance)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tolerance</p>
                <p className="font-medium">{formatNumber(test.tolerance)}</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Warning list component
 */
const WarningList: React.FC<WarningListProps> = ({ warnings }) => {
  if (warnings.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">No warnings detected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Data Quality': return BugIcon;
      case 'IFRS Compliance': return ShieldCheckIcon;
      case 'Cross-Statement': return BarChart3Icon;
      case 'Business Logic': return TargetIcon;
      default: return AlertTriangleIcon;
    }
  };

  return (
    <div className="space-y-4">
      {warnings.map((warning, index) => {
        const IconComponent = getCategoryIcon(warning.category);
        return (
          <Card key={index} className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <IconComponent className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <CardTitle className="text-base">{warning.message}</CardTitle>
                    <CardDescription>{warning.description}</CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Badge className="text-xs bg-blue-100 text-blue-800">
                    {warning.category}
                  </Badge>
                  <Badge className={`text-xs ${getSeverityColor(warning.severity)}`}>
                    {warning.severity}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Impact:</p>
                  <p>{warning.impact}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Recommendation:</p>
                  <p>{warning.recommendation}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Affected Statements:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {warning.affectedStatements.map((statement, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {statement}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

/**
 * Error list component
 */
const ErrorList: React.FC<ErrorListProps> = ({ errors }) => {
  if (errors.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">No errors detected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {errors.map((error, index) => (
        <Card key={index} className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <XCircleIcon className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <CardTitle className="text-base">{error.message}</CardTitle>
                  <CardDescription>{error.description}</CardDescription>
                </div>
              </div>
              <div className="flex space-x-2">
                <Badge className="text-xs bg-purple-100 text-purple-800">
                  {error.category}
                </Badge>
                <Badge className={`text-xs ${getSeverityColor(error.severity)}`}>
                  {error.severity}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Location:</p>
                <p>{error.location}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Resolution:</p>
                <p>{error.resolution}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Affected Statements:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {error.affectedStatements.map((statement, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {statement}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/**
 * Main Integration Testing Dashboard Component
 */
export const IntegrationTestingDashboard: React.FC<IntegrationTestingDashboardProps> = ({
  companyId,
  statements,
  onRunTests,
  onGenerateStatements,
  className = ''
}) => {
  const [currentStatements, setCurrentStatements] = useState<IntegratedFinancialStatements | null>(statements || null);
  const [testSuite, setTestSuite] = useState<IntegrationTestSuite | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    if (statements) {
      setCurrentStatements(statements);
    }
  }, [statements]);

  const handleGenerateStatements = async () => {
    if (!onGenerateStatements) return;
    
    setIsGenerating(true);
    try {
      const newStatements = await onGenerateStatements();
      setCurrentStatements(newStatements);
    } catch (error) {
      console.error('Failed to generate statements:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunTests = async () => {
    if (!currentStatements) return;
    
    setIsRunningTests(true);
    try {
      const results = await FinancialStatementsIntegrationService.runIntegrationTests(currentStatements);
      setTestSuite(results);
      
      if (onRunTests) {
        onRunTests(currentStatements);
      }
    } catch (error) {
      console.error('Failed to run tests:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const getOverallStatus = () => {
    if (!currentStatements) return null;
    return currentStatements.validationResults.overall;
  };

  const overallStatus = getOverallStatus();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Integration Testing</h2>
            <p className="text-muted-foreground">
              Cross-statement validation and IFRS compliance testing
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!currentStatements && onGenerateStatements && (
            <Button onClick={handleGenerateStatements} disabled={isGenerating}>
              <FileTextIcon className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-pulse' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate Statements'}
            </Button>
          )}
          
          {currentStatements && (
            <Button onClick={handleRunTests} disabled={isRunningTests}>
              <PlayIcon className={`h-4 w-4 mr-2 ${isRunningTests ? 'animate-spin' : ''}`} />
              {isRunningTests ? 'Running Tests...' : 'Run Tests'}
            </Button>
          )}
        </div>
      </div>

      {/* Overall Status */}
      {overallStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Overall Validation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${
                  overallStatus.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {overallStatus.isValid ? 'VALID' : 'INVALID'}
                </div>
                <p className="text-sm text-muted-foreground">Validation Status</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {overallStatus.confidence.toFixed(0)}%
                </div>
                <p className="text-sm text-muted-foreground">Confidence Score</p>
                <Progress value={overallStatus.confidence} className="mt-2" />
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {overallStatus.qualityScore.toFixed(0)}%
                </div>
                <p className="text-sm text-muted-foreground">Quality Score</p>
                <Progress value={overallStatus.qualityScore} className="mt-2" />
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {overallStatus.completeness.toFixed(0)}%
                </div>
                <p className="text-sm text-muted-foreground">Completeness</p>
                <Progress value={overallStatus.completeness} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results Summary */}
      {testSuite && (
        <Card>
          <CardHeader>
            <CardTitle>Test Execution Summary</CardTitle>
            <CardDescription>
              Executed {testSuite.totalTests} tests in {testSuite.executionTime}ms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {testSuite.passedTests}
                </div>
                <p className="text-sm text-muted-foreground">Tests Passed</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {testSuite.failedTests}
                </div>
                <p className="text-sm text-muted-foreground">Tests Failed</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {((testSuite.passedTests / testSuite.totalTests) * 100).toFixed(0)}%
                </div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="text-center">
              <Badge className="text-sm">
                {testSuite.summary}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {currentStatements ? (
        <Tabs defaultValue="validation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="tests">Test Results</TabsTrigger>
            <TabsTrigger value="warnings">Warnings</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="validation" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ValidationCard
                title="Balance Sheet Validation"
                status={currentStatements.validationResults.balanceSheetValidation.assetsEqualLiabilitiesPlusEquity}
                icon={BarChart3Icon}
                description="Assets = Liabilities + Equity equation"
                color="bg-blue-500"
              />
              
              <ValidationCard
                title="Cross-Statement Consistency"
                status={currentStatements.validationResults.crossStatementValidation.netIncomeConsistency}
                icon={TrendingUpIcon}
                description="Net income consistency across statements"
                color="bg-green-500"
              />
              
              <ValidationCard
                title="IFRS Compliance"
                status={currentStatements.validationResults.ifrsComplianceValidation.requiredDisclosuresPresent}
                icon={ShieldCheckIcon}
                description="Required disclosures and presentation"
                color="bg-purple-500"
              />
            </div>
          </TabsContent>

          <TabsContent value="tests">
            {testSuite ? (
              <div className="space-y-4">
                {testSuite.results.map((test, index) => (
                  <TestResultCard key={index} test={test} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-20">
                  <div className="text-center space-y-4">
                    <PlayIcon className="h-16 w-16 mx-auto text-muted-foreground" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">No Tests Run</h3>
                      <p className="text-muted-foreground">
                        Click "Run Tests" to execute the integration test suite
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="warnings">
            <WarningList warnings={currentStatements.validationResults.warnings} />
          </TabsContent>

          <TabsContent value="errors">
            <ErrorList errors={currentStatements.validationResults.errors} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <FileTextIcon className="h-16 w-16 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No Financial Statements</h3>
                <p className="text-muted-foreground">
                  Generate integrated financial statements to begin testing
                </p>
              </div>
              {onGenerateStatements && (
                <Button onClick={handleGenerateStatements} disabled={isGenerating}>
                  <FileTextIcon className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-pulse' : ''}`} />
                  Generate Statements
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};