import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Minimize2 from "lucide-react/dist/esm/icons/minimize-2";
import Maximize2 from "lucide-react/dist/esm/icons/maximize-2";
import { FormattedClient, ClientStatistics } from "@/types/client.types";
import { ClientListItem } from "./ClientListItem";

interface ClientListProps {
  filteredClients: FormattedClient[];
  expandedClients: Set<string>;
  isAllExpanded: boolean;
  viewMode: 'active' | 'archived';
  statistics: ClientStatistics | null;
  searchTerm: string;
  filterStatus: string;
  filterIndustry: string;
  globalSelectedCompany: string | number;
  onToggleClientExpansion: (clientId: string) => void;
  onToggleAllExpansion: () => void;
  onSetViewMode: (mode: 'active' | 'archived') => void;
  onSetEditingClient: (client: FormattedClient) => void;
  onArchiveClient: (clientId: string) => void;
  onRestoreClient: (clientId: string) => void;
  onDeleteClient: (clientId: string) => void;
  onDuplicateClient?: (clientId: string) => void;
}

export const ClientList: React.FC<ClientListProps> = ({
  filteredClients,
  expandedClients,
  isAllExpanded,
  viewMode,
  statistics,
  searchTerm,
  filterStatus,
  filterIndustry,
  globalSelectedCompany,
  onToggleClientExpansion,
  onToggleAllExpansion,
  onSetViewMode,
  onSetEditingClient,
  onArchiveClient,
  onRestoreClient,
  onDeleteClient,
  onDuplicateClient,
}) => {
  return (
    <>
      {/* Client Action Buttons and View Mode Tabs */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div></div>
        
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {filteredClients.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleAllExpansion}
            >
              {isAllExpanded ? (
                <>
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Collapse All
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Expand All
                </>
              )}
            </Button>
          )}
          
          <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
            <Button
              variant={viewMode === 'active' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onSetViewMode('active')}
              className={viewMode === 'active' ? 'bg-black text-white hover:bg-black' : 'hover:bg-gray-200'}
            >
              Active Clients
            </Button>
            <Button
              variant={viewMode === 'archived' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onSetViewMode('archived')}
              className={viewMode === 'archived' ? 'bg-black text-white hover:bg-black' : 'hover:bg-gray-200'}
            >
              Archived ({statistics?.statusBreakdown?.archived?.count || 0})
            </Button>
          </div>
        </div>
      </div>

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {viewMode === 'active' ? 'Client Directory' : 'Archived Clients'}
          </CardTitle>
          <CardDescription>
            {viewMode === 'active' ? 'Manage and view all your clients' : 'View and restore archived clients'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredClients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || filterStatus !== 'all' || filterIndustry !== 'all' || globalSelectedCompany !== 'all'
                  ? 'No clients match your filters' 
                  : 'No clients yet. Add your first client!'}
              </div>
            ) : (
              filteredClients.map((client) => (
                <ClientListItem
                  key={client.id}
                  client={client}
                  isExpanded={expandedClients.has(client.id)}
                  viewMode={viewMode}
                  onToggleExpansion={onToggleClientExpansion}
                  onEdit={onSetEditingClient}
                  onArchive={onArchiveClient}
                  onRestore={onRestoreClient}
                  onDelete={onDeleteClient}
                  onDuplicate={onDuplicateClient}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};