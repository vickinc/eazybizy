import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Building2, Calendar, StickyNote, CreditCard } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    totalCompanies: number;
    activeCompaniesCount: number;
    passiveCompaniesCount: number;
    upcomingEventsCount: number;
    activeNotesCount: number;
    activeBusinessCardsCount: number;
    archivedBusinessCardsCount: number;
  };
  isLoading: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  isLoading,
}) => {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Building2 className="h-4 w-4 mr-2" />
                  Total Companies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {isLoading ? "..." : stats.totalCompanies}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeCompaniesCount} Active, {stats.passiveCompaniesCount} Passive
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total number of companies in your portfolio (Active + Passive)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {isLoading ? "..." : stats.upcomingEventsCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Next 30 days
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Number of events scheduled in the next 30 days</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <StickyNote className="h-4 w-4 mr-2" />
                  Active Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {isLoading ? "..." : stats.activeNotesCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeNotesCount > 0 ? "View all notes" : "No active notes"}
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Number of incomplete notes (Standalone + Event-Related)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Business Cards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {isLoading ? "..." : stats.activeBusinessCardsCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeBusinessCardsCount > 0 ? 
                    `${stats.activeBusinessCardsCount} active, ${stats.archivedBusinessCardsCount} archived` : 
                    "Ready to download"
                  }
                </p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Number of active business cards (not archived)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};