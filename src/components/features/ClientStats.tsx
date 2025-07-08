import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Users, UserCheck, TrendingUp, DollarSign } from "lucide-react";
import { ClientStatistics } from "@/services/api/clientsApiService";

interface ClientStatsProps {
  statistics: ClientStatistics | null;
}

export const ClientStats: React.FC<ClientStatsProps> = ({ statistics }) => {
  // Extract values from the actual API response structure
  const totalClients = statistics?.summary?.totalClients || 0;
  
  // The API groups clients as "active" (includes ACTIVE + LEAD) and "archived"
  const activeClients = statistics?.statusBreakdown?.active?.count || 0;
  
  // For leads, we need to count from the recentClients or calculate differently
  // Since the API doesn't separate LEAD from ACTIVE in statusBreakdown, 
  // let's count leads from the recentClients data
  const leadClients = statistics?.recentClients?.filter(client => client.status === 'LEAD').length || 0;
  
  const totalRevenue = statistics?.summary?.totalRevenue || 0;

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <UserCheck className="h-4 w-4 mr-2" />
              Active Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{activeClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{leadClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalRevenue.toLocaleString('en-US', { 
              style: 'currency', 
              currency: 'USD' 
            })}</div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};