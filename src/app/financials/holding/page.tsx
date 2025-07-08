'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FolderOpenIcon,
  BuildingIcon,
  PlusIcon,
  RefreshCwIcon,
  SettingsIcon,
  LoaderIcon,
  AlertCircleIcon,
  CheckCircleIcon
} from 'lucide-react';
import { VirtualHoldingDashboard } from '@/components/features/VirtualHoldingDashboard';
import { useCompanyFilter } from '@/contexts/CompanyFilterContext';
import { 
  VirtualHolding, 
  ConsolidatedFinancials,
  VirtualHoldingBusinessService 
} from '@/services/business/virtualHoldingBusinessService';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function VirtualHoldingPage() {
  // State management
  const [holdings, setHoldings] = useState<VirtualHolding[]>([]);
  const [selectedHolding, setSelectedHolding] = useState<VirtualHolding | null>(null);
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedFinancials | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Hooks
  const { companies } = useCompanyFilter();

  // Initialize with demo data
  useEffect(() => {
    loadDemoHoldings();
  }, []);

  const loadDemoHoldings = async () => {
    try {
      // Create demo virtual holding
      const demoHolding = await VirtualHoldingBusinessService.createVirtualHolding(
        "Technology Portfolio",
        "Combined portfolio of technology companies with focus on SaaS and digital services",
        "USD",
        []
      );

      // Add demo companies
      demoHolding.companies = [
        {
          companyId: "company-1",
          companyName: "TechCorp Solutions",
          weight: 40,
          currency: "USD",
          includedInConsolidation: true,
          segment: "Software",
          region: "North America"
        },
        {
          companyId: "company-2", 
          companyName: "Digital Innovations Ltd",
          weight: 35,
          currency: "EUR",
          includedInConsolidation: true,
          segment: "Digital Services",
          region: "Europe"
        },
        {
          companyId: "company-3",
          companyName: "Cloud Systems Inc",
          weight: 25,
          currency: "USD",
          includedInConsolidation: true,
          segment: "Cloud Infrastructure",
          region: "North America"
        }
      ];

      setHoldings([demoHolding]);
      setSelectedHolding(demoHolding);
      
      // Generate initial consolidated financials
      await generateConsolidatedFinancials(demoHolding);
    } catch (error) {
      console.error('Failed to load demo holdings:', error);
      toast.error('Failed to load virtual holdings');
    }
  };

  const generateConsolidatedFinancials = async (holding: VirtualHolding) => {
    setIsGenerating(true);
    
    try {
      const period = new Date().getFullYear().toString();
      const consolidated = await VirtualHoldingBusinessService.generateConsolidatedFinancials(
        holding,
        period,
        true
      );
      
      setConsolidatedData(consolidated);
      toast.success('Consolidated financials generated successfully');
    } catch (error) {
      console.error('Failed to generate consolidated financials:', error);
      toast.error('Failed to generate consolidated financials');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefresh = async () => {
    if (selectedHolding) {
      await generateConsolidatedFinancials(selectedHolding);
    }
  };

  const handleExport = async (format: 'PDF' | 'Excel') => {
    if (!consolidatedData) return;
    
    try {
      toast.info(`Exporting virtual holding report to ${format}...`);
      // TODO: Implement actual export functionality
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const handleEditHolding = () => {
    toast.info('Holding configuration coming soon');
  };

  const createNewHolding = async () => {
    try {
      const newHolding = await VirtualHoldingBusinessService.createVirtualHolding(
        "New Portfolio",
        "Newly created virtual holding portfolio",
        "USD"
      );
      
      setHoldings(prev => [...prev, newHolding]);
      setSelectedHolding(newHolding);
      toast.success('New virtual holding created');
    } catch (error) {
      toast.error('Failed to create virtual holding');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!selectedHolding) {
    return (
      <div className="min-h-screen bg-lime-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" suppressHydrationWarning>
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FolderOpenIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Virtual Holding</h1>
              <p className="text-muted-foreground">
                Group companies and analyze combined financial performance
              </p>
            </div>
          </div>

          <Button onClick={createNewHolding}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Holding
          </Button>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <FolderOpenIcon className="h-16 w-16 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No Virtual Holdings</h3>
                <p className="text-muted-foreground max-w-md">
                  Create your first virtual holding to group companies and analyze their combined performance across different currencies and regions.
                </p>
              </div>
              <Button onClick={createNewHolding}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Your First Holding
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <BuildingIcon className="h-5 w-5 mr-2" />
                Company Grouping
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Group multiple companies into virtual portfolios for consolidated analysis without legal consolidation requirements.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <RefreshCwIcon className="h-5 w-5 mr-2" />
                Multi-Currency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automatically convert and aggregate financial data across different currencies with real-time exchange rates.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Comprehensive risk assessment including currency exposure, geographic concentration, and performance analysis.
              </p>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" suppressHydrationWarning>
      {/* Holdings Selector */}
      {holdings.length > 1 && (
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Virtual Holding:</span>
          <div className="flex items-center space-x-2">
            {holdings.map((holding) => (
              <Button
                key={holding.id}
                variant={selectedHolding?.id === holding.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedHolding(holding);
                  generateConsolidatedFinancials(holding);
                }}
              >
                {holding.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <LoaderIcon className="h-10 w-10 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                Generating consolidated financial analysis...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard */}
      {!isGenerating && consolidatedData && (
        <VirtualHoldingDashboard
          holding={selectedHolding}
          consolidatedFinancials={consolidatedData}
          onRefresh={handleRefresh}
          onExport={handleExport}
          onEditHolding={handleEditHolding}
        />
      )}
      </div>
    </div>
  );
} 