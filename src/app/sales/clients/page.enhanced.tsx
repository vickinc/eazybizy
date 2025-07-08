/**
 * Enhanced Clients Page
 * 
 * Complete client management with error boundaries, loading states,
 * virtual scrolling, and real-time search for optimal performance.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Search, Users, Building, User, Mail, Phone, Globe } from 'lucide-react';
import { ErrorBoundary, ApiErrorBoundary } from '@/components/ui/error-boundary';
import { 
  LoadingSpinner, 
  PageLoading, 
  ClientListSkeleton,
  StatsCardSkeleton 
} from '@/components/ui/loading-states';
import { VirtualClientList } from '@/components/ui/virtual-scroll';
import { AdvancedPagination, DataViewToggle, useSmartPagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientsManagement } from '@/hooks/useClientsManagement.new';
import { useCompanies } from '@/hooks/useCompanies';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

interface ClientsPageEnhancedProps {
  initialCompanyId?: number;
}

const ClientsPageEnhanced: React.FC<ClientsPageEnhancedProps> = ({ initialCompanyId }) => {
  // State management
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(initialCompanyId || 1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Data fetching
  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const {
    clients,
    totalCount,
    isLoading,
    error,
    statistics,
    createClient,
    updateClient,
    deleteClient,
    exportClients,
    industries,
    filters,
    setFilters,
    pagination,
    setPagination
  } = useClientsManagement({
    companyId: selectedCompanyId,
    pageSize: 24,
    search: searchQuery,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    clientType: typeFilter !== 'all' ? typeFilter : undefined,
    industry: industryFilter !== 'all' ? industryFilter : undefined
  });

  // Smart pagination
  const paginationState = useSmartPagination({
    totalItems: totalCount || 0,
    defaultPageSize: 24
  });

  // Memoized filtered clients for performance
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    
    let filtered = [...clients];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.industry?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [clients, searchQuery]);

  // Event handlers
  const handleCreateClient = useCallback(async (clientData: any) => {
    try {
      await createClient.mutateAsync(clientData);
      toast.success('Client created successfully');
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error('Failed to create client');
    }
  }, [createClient]);

  const handleUpdateClient = useCallback(async (id: string, clientData: any) => {
    try {
      await updateClient.mutateAsync({ id, data: clientData });
      toast.success('Client updated successfully');
      setSelectedClient(null);
    } catch (error) {
      toast.error('Failed to update client');
    }
  }, [updateClient]);

  const handleDeleteClient = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    
    try {
      await deleteClient.mutateAsync(id);
      toast.success('Client deleted successfully');
    } catch (error) {
      toast.error('Failed to delete client');
    }
  }, [deleteClient]);

  const handleExportClients = useCallback(async () => {
    try {
      await exportClients.mutateAsync({ format: 'csv', filters });
      toast.success('Clients exported successfully');
    } catch (error) {
      toast.error('Failed to export clients');
    }
  }, [exportClients, filters]);

  const handleClientClick = useCallback((client: any) => {
    setSelectedClient(client);
  }, []);

  // Loading states
  if (companiesLoading) {
    return <PageLoading message="Loading companies..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-lime-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Clients</h3>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary level="page">
      <div className="min-h-screen bg-lime-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Clients
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Manage your client relationships and contacts
                </p>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <ApiErrorBoundary>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <StatsCardSkeleton key={i} />
                ))
              ) : (
                <>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Clients</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {statistics?.totalClients?.toLocaleString() || 0}
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="mt-2 flex items-center text-sm text-green-600">
                        +{statistics?.newClientsThisMonth || 0} this month
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Active Clients</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {statistics?.activeClients || 0}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          {statistics?.activePercentage || 0}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Individuals</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {statistics?.individualClients || 0}
                          </p>
                        </div>
                        <User className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Companies</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {statistics?.legalEntityClients || 0}
                          </p>
                        </div>
                        <Building className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </ApiErrorBoundary>

          {/* Controls */}
          <ApiErrorBoundary>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 mb-6">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
                {/* Company Selection */}
                <Select
                  value={selectedCompanyId.toString()}
                  onValueChange={(value) => setSelectedCompanyId(parseInt(value))}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies?.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.tradingName || company.legalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="flex space-x-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="LEAD">Lead</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Legal Entity">Company</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      {industries?.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-4">
                <DataViewToggle view={viewMode} onViewChange={setViewMode} />
                
                <Button
                  variant="outline"
                  onClick={handleExportClients}
                  disabled={exportClients.isPending}
                  className="flex items-center space-x-2"
                >
                  {exportClients.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                  <span>Export</span>
                </Button>

                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Client</span>
                </Button>
              </div>
            </div>
          </ApiErrorBoundary>

          {/* Client List */}
          <ApiErrorBoundary>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    Clients ({totalCount?.toLocaleString() || 0})
                  </span>
                  {isLoading && <LoadingSpinner size="sm" />}
                </CardTitle>
                <CardDescription>
                  Manage and organize your client relationships
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <ClientListSkeleton />
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No clients found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || industryFilter !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Get started by adding your first client'
                      }
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Client
                    </Button>
                  </div>
                ) : viewMode === 'list' ? (
                  <VirtualClientList
                    clients={filteredClients}
                    onClientClick={handleClientClick}
                    height={600}
                    loading={isLoading}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredClients.map((client) => (
                      <Card 
                        key={client.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleClientClick(client)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className={cn(
                              "h-12 w-12 rounded-full flex items-center justify-center",
                              client.clientType === 'Legal Entity' ? 'bg-orange-100' : 'bg-purple-100'
                            )}>
                              {client.clientType === 'Legal Entity' ? (
                                <Building className="h-6 w-6 text-orange-600" />
                              ) : (
                                <User className="h-6 w-6 text-purple-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{client.name}</h3>
                              <Badge
                                variant={
                                  client.status === 'ACTIVE' ? 'default' :
                                  client.status === 'LEAD' ? 'secondary' :
                                  client.status === 'INACTIVE' ? 'outline' : 'destructive'
                                }
                                className="text-xs"
                              >
                                {client.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {client.email && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Mail className="h-4 w-4" />
                                <span className="truncate">{client.email}</span>
                              </div>
                            )}
                            
                            {client.phone && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                            
                            {client.industry && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Globe className="h-4 w-4" />
                                <span className="truncate">{client.industry}</span>
                              </div>
                            )}

                            {client.lastInvoiceDate && (
                              <div className="text-xs text-gray-500 mt-2">
                                Last invoice: {new Date(client.lastInvoiceDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {filteredClients.length > 0 && (
                  <div className="mt-6">
                    <AdvancedPagination
                      currentPage={paginationState.currentPage}
                      totalPages={paginationState.totalPages}
                      pageSize={paginationState.pageSize}
                      totalItems={totalCount || 0}
                      onPageChange={paginationState.goToPage}
                      onPageSizeChange={paginationState.changePageSize}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </ApiErrorBoundary>

          {/* Create/Edit Client Dialog */}
          {/* Add your enhanced client dialog component here */}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ClientsPageEnhanced;